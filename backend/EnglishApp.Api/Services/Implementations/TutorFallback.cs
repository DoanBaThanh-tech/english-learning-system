using System.Text.RegularExpressions;

namespace EnglishApp.Api.Services.Implementations;

public sealed record TutorCorrection(string Original, string Correction, string Explanation);

/// <summary>
/// Gia sư offline: sửa các lỗi người Việt học tiếng Anh hay gặp và trả lời theo
/// kịch bản. Được dùng khi chưa cấu hình AI hoặc nhà cung cấp AI lỗi.
/// </summary>
public static class TutorFallback
{
    private static readonly (string Pattern, string Replacement, string Explanation)[] Rules =
    {
        (@"\bI am agree\b", "I agree", "agree là động từ, không dùng to be phía trước."),
        (@"\b(he|she|it) don't\b", "$1 doesn't", "Ngôi thứ ba số ít dùng doesn't."),
        (@"\bI very like\b", "I really like", "very không đứng trước động từ; dùng really."),
        (@"\bmore better\b", "better", "better đã là so sánh hơn, không thêm more."),
        (@"\bpeoples\b", "people", "people đã là số nhiều."),
        (@"\binformations\b", "information", "information là danh từ không đếm được."),
        (@"\badvices\b", "advice", "advice là danh từ không đếm được."),
        (@"\bdiscuss about\b", "discuss", "discuss không đi với about."),
        (@"\bI have (\d+) years old\b", "I am $1 years old", "Tuổi dùng 'I am ... years old'."),
        (@"\bI go to (.+?) yesterday\b", "I went to $1 yesterday", "yesterday cần thì quá khứ."),
        (@"\bI want\b", "I would like", "Dùng 'I would like' lịch sự hơn trong hội thoại.")
    };

    public static (string Corrected, List<TutorCorrection> Corrections) Correct(string text)
    {
        var corrected = text.Trim();
        var corrections = new List<TutorCorrection>();

        foreach (var (pattern, replacement, explanation) in Rules)
        {
            var match = Regex.Match(corrected, pattern, RegexOptions.IgnoreCase);
            if (!match.Success) continue;

            var fixedMatch = Regex.Replace(match.Value, pattern, replacement, RegexOptions.IgnoreCase);
            if (string.Equals(match.Value, fixedMatch, StringComparison.Ordinal)) continue;

            corrections.Add(new TutorCorrection(match.Value, fixedMatch, explanation));
            corrected = Regex.Replace(corrected, pattern, replacement, RegexOptions.IgnoreCase);
        }

        var lowerI = Regex.Match(corrected, @"\bi\b");
        if (lowerI.Success)
        {
            corrections.Add(new TutorCorrection("i", "I", "Đại từ 'I' luôn viết hoa."));
            corrected = Regex.Replace(corrected, @"\bi\b", "I");
        }

        if (corrected.Length > 0)
        {
            corrected = char.ToUpperInvariant(corrected[0]) + corrected[1..];
            if (!".!?".Contains(corrected[^1]))
            {
                corrected += ".";
            }
        }

        return (corrected, corrections.Take(6).ToList());
    }

    public static string Reply(string? scenarioName, string userText, int turn)
    {
        var name = (scenarioName ?? string.Empty).ToLowerInvariant();

        var bank = name switch
        {
            var n when n.Contains("cà phê") || n.Contains("cafe") || n.Contains("coffee") => new[]
            {
                "Of course! Would you like it hot or iced? (Gợi ý: \"I'd like it iced, please.\")",
                "Great choice. Would you like anything to eat with that? (Gợi ý: \"Yes, I'd like a croissant.\")",
                "Sure. Your total is 45,000 dong. How would you like to pay? (Gợi ý: \"By cash, please.\")"
            },
            var n when n.Contains("phỏng vấn") || n.Contains("interview") || n.Contains("job") => new[]
            {
                "Thanks for joining us. Could you tell me a little about yourself? (Gợi ý: vai trò, kinh nghiệm, một dự án.)",
                "Good. Can you describe a difficult bug you fixed and how you approached it? (Gợi ý: situation → action → result.)",
                "How do you work with a team when requirements change? (Gợi ý: \"We agreed to...\")"
            },
            var n when n.Contains("sân bay") || n.Contains("airport") => new[]
            {
                "May I see your passport, please? (Gợi ý: \"Here you are.\")",
                "How long do you plan to stay? (Gợi ý: \"For two weeks.\")",
                "Do you have anything to declare? (Gợi ý: \"No, nothing to declare.\")"
            },
            var n when n.Contains("đồng nghiệp") || n.Contains("colleague") || n.Contains("small talk") => new[]
            {
                "Morning! How was your weekend? (Gợi ý: dùng thì quá khứ: \"It was relaxing.\")",
                "Nice. Did you try that new coffee place near the office? (Gợi ý: \"Not yet, is it good?\")",
                "By the way, are you ready for the meeting at ten? (Gợi ý: \"I think so, I reviewed the slides.\")"
            },
            var n when n.Contains("thuyết trình") || n.Contains("present") || n.Contains("project") => new[]
            {
                "Thanks for the overview. Who is the main user, and what problem are you solving? (Gợi ý: user + pain point.)",
                "What is the biggest risk to the timeline? (Gợi ý: \"The main risk is...\")",
                "How will you measure success after launch? (Gợi ý: \"We will track...\")"
            },
            _ => new[]
            {
                "That's interesting. Can you tell me more about it? (Gợi ý: thêm một ví dụ cụ thể.)",
                "I see. How did you feel about that? (Gợi ý: dùng tính từ cảm xúc.)",
                "Nice. What would you like to practice next? (Gợi ý: từ vựng, phát âm hoặc hội thoại.)"
            }
        };

        if (string.IsNullOrWhiteSpace(userText))
        {
            return "Could you say that again? (Gợi ý: thử nói một câu ngắn trước.)";
        }

        return bank[Math.Abs(turn) % bank.Length];
    }
}
