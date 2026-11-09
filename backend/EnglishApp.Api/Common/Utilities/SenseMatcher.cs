using System.Globalization;

namespace EnglishApp.Api.Common.Utilities;

public sealed record SenseCandidate(
    int SenseId,
    string DefinitionEn,
    IReadOnlyList<string> Examples,
    string PartOfSpeech);

public sealed record SenseChoice(int Index, double Confidence);

/// <summary>
/// Chọn nghĩa của từ dựa trên ngữ cảnh: giao nhau token với định nghĩa/ví dụ,
/// cộng tín hiệu từ loại và các mẫu câu tiếng Anh thường gặp.
/// Đây là lớp offline; khi bật AI, DictionaryService có thể thay bằng AI.
/// </summary>
public static class SenseMatcher
{
    public static SenseChoice Choose(string sentence, IReadOnlyList<SenseCandidate> candidates, string targetWord = "")
    {
        if (candidates.Count == 0)
        {
            return new SenseChoice(-1, 0);
        }

        var contextTokens = TextUtil.ContentTokens(sentence).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var scores = new double[candidates.Count];

        for (var i = 0; i < candidates.Count; i++)
        {
            var candidate = candidates[i];
            var candidateTokens = TextUtil.ContentTokens(candidate.DefinitionEn)
                .Concat(candidate.Examples.SelectMany(e => TextUtil.ContentTokens(e)))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var overlap = candidateTokens.Count(contextTokens.Contains);
            if (candidateTokens.Count > 0)
            {
                scores[i] += 2.4 * overlap / Math.Sqrt(candidateTokens.Count);
            }

            foreach (var example in candidate.Examples)
            {
                var exampleTokens = TextUtil.ContentTokens(example).ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (exampleTokens.Count == 0) continue;
                var ratio = exampleTokens.Count(contextTokens.Contains) / (double)exampleTokens.Count;
                if (ratio > 0.35) scores[i] += ratio * 2;
            }

            scores[i] += PosBoost(candidate.PartOfSpeech, sentence);
            scores[i] += LooksLikeTargetSense(sentence, targetWord, candidate);
        }

        var best = 0;
        for (var i = 1; i < scores.Length; i++)
        {
            if (scores[i] > scores[best]) best = i;
        }

        var spread = scores.OrderByDescending(s => s).ToArray();
        var gap = spread.Length > 1 ? Math.Max(0, spread[0] - spread[1]) : 1;
        var confidence = Math.Clamp(55 + gap * 9 + scores[best] * 5, 55, 97);

        return new SenseChoice(best, Math.Round(confidence, 1));
    }

    private static double PosBoost(string pos, string sentence)
    {
        var lower = sentence.ToLowerInvariant();
        var tokens = TextUtil.Tokenize(sentence);
        var articleBefore = false;
        for (var i = 1; i < tokens.Count; i++)
        {
            if (tokens[i - 1] is "a" or "an" or "the") articleBefore = true;
        }

        return pos switch
        {
            "verb" when ContainsAny(lower, " to ", " will ", " can ", " should ", " must ", " may ", " might ", " did ", " does ", " do ", " not ") => 0.55,
            "noun" when articleBefore => 0.45,
            "adjective" when ContainsAny(lower, " very ", " so ", " too ", " really ", " quite ") => 0.35,
            "adverb" => 0.15,
            _ => 0
        };
    }

    private static double LooksLikeTargetSense(string sentence, string targetWord, SenseCandidate candidate)
    {
        if (string.IsNullOrWhiteSpace(targetWord))
        {
            return 0;
        }

        var lowerSentence = sentence.ToLowerInvariant();
        var definition = candidate.DefinitionEn.ToLowerInvariant();
        var word = targetWord.ToLowerInvariant();

        var boost = 0d;
        if (definition.Contains(word + " that", StringComparison.Ordinal) ||
            definition.Contains(word + " something", StringComparison.Ordinal))
        {
            boost += 0.3;
        }

        var prefix = System.Text.RegularExpressions.Regex.Escape(word[..Math.Min(word.Length, 4)]);

        if (candidate.PartOfSpeech == "verb" &&
            System.Text.RegularExpressions.Regex.IsMatch(lowerSentence,
                $@"\b(to|will|can|could|should|must|may|might)\s+\w*\s*{prefix}"))
        {
            boost += 0.3;
        }

        return boost;
    }

    private static bool ContainsAny(string text, params string[] values) =>
        values.Any(v => text.Contains(v, StringComparison.Ordinal));
}

public static class NumberFormat
{
    public static string Pct(double value) =>
        Math.Clamp(value, 0, 100).ToString("0.#", CultureInfo.InvariantCulture) + "%";
}
