using System.Text.RegularExpressions;

namespace EnglishApp.Api.Common.Utilities;

public sealed record SpeechWordResult(string Word, string Spoken, bool Correct);
public sealed record SpeechComparison(int Score, IReadOnlyList<SpeechWordResult> Words, IReadOnlyList<string> Tips);

/// <summary>
/// So khớp câu đọc với transcript (từ Web Speech API hoặc một ASR khác)
/// bằng căn chỉnh Levenshtein cấp từ, sau đó sinh gợi ý theo lỗi phổ biến
/// của người Việt. Không thay thế chấm điểm âm vị của dịch vụ chuyên dụng,
/// nhưng cho phản hồi tức thì, miễn phí và có thể nâng cấp provider sau.
/// </summary>
public static class SpeechComparer
{
    private static readonly (string Pattern, string Tip)[] CommonTips =
    {
        (@"th", "Bật hơi đầu lưỡi cho /θ/ (think, three), đừng đọc thành /t/."),
        (@"r", "Uốn lưỡi nhẹ cho /r/, không đọc như /z/ hay /l/."),
        (@"l", "Đặt đầu lưỡi sau răng trên cho /l/ (light, small)."),
        (@"s$", "Giữ âm cuối /s/ rõ ràng, tránh bỏ đuôi."),
        (@"ed$", "Phân biệt đuôi -ed: /t/, /d/ hoặc /ɪd/ tùy từ gốc."),
        (@"ing$", "Giữ âm mũi cuối /ŋ/ cho -ing."),
        (@"v", "Răng trên chạm môi dưới cho /v/, tránh đọc thành /w/."),
        (@"sh", "Tròn môi và đẩy hơi cho /ʃ/ (she, ship).")
    };

    public static SpeechComparison Compare(string reference, string transcript)
    {
        var refTokens = TextUtil.Tokenize(reference);
        var spokenTokens = TextUtil.Tokenize(transcript);

        if (refTokens.Count == 0)
        {
            return new SpeechComparison(0, Array.Empty<SpeechWordResult>(),
                new[] { "Câu mẫu đang trống, hãy nhập câu cần đọc." });
        }

        var alignment = Align(refTokens, spokenTokens);
        var correctCount = alignment.Count(a => a.Correct);
        var mistakes = alignment.Where(a => !a.Correct).ToList();

        var accuracy = correctCount / (double)refTokens.Count;
        var completeness = spokenTokens.Count == 0
            ? 0
            : Math.Min(1, refTokens.Count / (double)spokenTokens.Count);
        var extraPenalty = spokenTokens.Count > refTokens.Count
            ? Math.Min(0.2, (spokenTokens.Count - refTokens.Count) / (double)Math.Max(1, refTokens.Count) * 0.1)
            : 0;

        var score = (int)Math.Round(Math.Clamp(accuracy * 70 + completeness * 30 - extraPenalty * 100, 0, 100));

        var tips = new List<string>();
        foreach (var mistake in mistakes.Take(5))
        {
            foreach (var (pattern, tip) in CommonTips)
            {
                if (Regex.IsMatch(mistake.Word, pattern, RegexOptions.IgnoreCase) && !tips.Contains(tip))
                {
                    tips.Add(tip);
                }
            }
        }

        if (tips.Count == 0)
        {
            tips.Add(score >= 85
                ? "Phát âm rất tốt. Hãy giữ nhịp đọc tự nhiên và thử tăng tốc độ."
                : "Đọc chậm lại, chia câu thành cụm ngắn và giữ rõ phụ âm cuối.");
        }

        if (spokenTokens.Count == 0)
        {
            tips.Insert(0, "Chưa nhận được giọng đọc. Hãy thử micro hoặc nhập transcript.");
        }

        return new SpeechComparison(score, alignment, tips);
    }

    private static List<SpeechWordResult> Align(IReadOnlyList<string> reference, IReadOnlyList<string> spoken)
    {
        var results = new List<SpeechWordResult>();
        var rows = reference.Count + 1;
        var cols = spoken.Count + 1;
        var dp = new int[rows, cols];

        for (var i = 0; i < rows; i++) dp[i, 0] = i;
        for (var j = 0; j < cols; j++) dp[0, j] = j;

        for (var i = 1; i < rows; i++)
        {
            for (var j = 1; j < cols; j++)
            {
                var cost = string.Equals(reference[i - 1], spoken[j - 1], StringComparison.OrdinalIgnoreCase) ? 0 : 1;
                dp[i, j] = Math.Min(Math.Min(dp[i - 1, j] + 1, dp[i, j - 1] + 1), dp[i - 1, j - 1] + cost);
            }
        }

        var x = reference.Count;
        var y = spoken.Count;
        var reversed = new List<SpeechWordResult>();

        while (x > 0 || y > 0)
        {
            if (x > 0 && y > 0)
            {
                var cost = string.Equals(reference[x - 1], spoken[y - 1], StringComparison.OrdinalIgnoreCase) ? 0 : 1;
                if (dp[x, y] == dp[x - 1, y - 1] + cost)
                {
                    reversed.Add(new SpeechWordResult(reference[x - 1], spoken[y - 1], cost == 0));
                    x--;
                    y--;
                    continue;
                }
            }

            if (x > 0 && dp[x, y] == dp[x - 1, y] + 1)
            {
                reversed.Add(new SpeechWordResult(reference[x - 1], "", false));
                x--;
                continue;
            }

            // Từ nói thêm, không nằm trong câu mẫu: bỏ qua để căn chỉnh tiếp.
            if (y > 0)
            {
                y--;
                continue;
            }

            break;
        }

        reversed.Reverse();
        results.AddRange(reversed);
        return results;
    }
}
