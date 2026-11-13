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

            scores[i] += PosBoost(candidate.PartOfSpeech, sentence, targetWord);
            scores[i] += SubjectSenseBoost(sentence, candidate, targetWord);
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

    private static readonly HashSet<string> Determiners = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "an", "the", "this", "that", "these", "those", "my", "your", "his", "her",
        "its", "our", "their", "some", "any", "no", "each", "every", "another"
    };

    private static readonly HashSet<string> ModalMarkers = new(StringComparer.OrdinalIgnoreCase)
    {
        "to", "will", "would", "can", "could", "should", "must", "may", "might",
        "do", "does", "did", "not", "never", "please"
    };

    private static readonly HashSet<string> Subjects = new(StringComparer.OrdinalIgnoreCase)
    {
        "i", "you", "he", "she", "it", "we", "they", "who", "someone", "everyone"
    };

    private static readonly HashSet<string> BeForms = new(StringComparer.OrdinalIgnoreCase)
    {
        "is", "are", "was", "were", "am", "be", "been", "being", "seems", "feels"
    };

    private static readonly HashSet<string> Prepositions = new(StringComparer.OrdinalIgnoreCase)
    {
        "of", "in", "on", "at", "by", "for", "with", "from", "about", "into",
        "through", "during", "before", "after", "under", "over", "between"
    };

    private static readonly HashSet<string> Intensifiers = new(StringComparer.OrdinalIgnoreCase)
    {
        "very", "so", "too", "really", "quite", "extremely", "fairly", "pretty"
    };

    private static readonly HashSet<string> ParticleWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "up", "down", "out", "off", "over", "back", "away", "through", "around", "about", "along"
    };

    private static readonly HashSet<string> LinkVerbs = new(StringComparer.OrdinalIgnoreCase)
    {
        "is", "are", "was", "were", "am", "be", "been", "being",
        "seem", "seems", "seemed", "feel", "feels", "felt",
        "stay", "stays", "stayed", "remain", "remains", "remained",
        "become", "becomes", "became", "grow", "grows", "grew",
        "look", "looks", "looked", "sound", "sounds", "sounded",
        "turn", "turns", "turned", "get", "gets", "got"
    };

    private static readonly HashSet<string> PersonWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "i", "you", "he", "she", "we", "they", "who", "someone", "everyone",
        "people", "person", "child", "children", "student", "students",
        "team", "teams", "employee", "employees", "worker", "workers",
        "friend", "friends", "leader", "leaders", "player", "players",
        "man", "woman", "men", "women", "boy", "girl"
    };

    /// <summary>
    /// Cộng điểm theo vị trí thật của từ cần tra trong câu. Ví dụ "She runs a small café"
    /// cho thấy sau "runs" là mạo từ + danh từ nên đây gần như chắc chắn là động từ,
    /// còn "The bank is closed" cho thấy "bank" đứng trước "is" nên là danh từ.
    /// </summary>
    private static double PosBoost(string pos, string sentence, string targetWord)
    {
        var tokens = TextUtil.Tokenize(sentence);
        var targetTokens = TextUtil.Tokenize(targetWord);
        var index = -1;

        if (targetTokens.Count > 0)
        {
            for (var i = 0; i < tokens.Count; i++)
            {
                if (string.Equals(tokens[i], targetTokens[0], StringComparison.OrdinalIgnoreCase))
                {
                    index = i;
                    break;
                }
            }
        }

        if (index < 0)
        {
            return FallbackPosBoost(pos, sentence);
        }

        var previous = index > 0 ? tokens[index - 1] : string.Empty;
        var next = index + 1 < tokens.Count ? tokens[index + 1] : string.Empty;
        var word = targetTokens[0];

        switch (pos)
        {
            case "verb":
            {
                var boost = 0d;
                if (ModalMarkers.Contains(previous)) boost += 0.9;
                if (Subjects.Contains(previous)) boost += 0.6;
                if (Determiners.Contains(next)) boost += 0.7;
                if (Prepositions.Contains(next)) boost += 0.1;
                if (ParticleWords.Contains(next)) boost += 0.15;
                if (Subjects.Contains(previous) &&
                    (word.EndsWith('s') || word.EndsWith("ed", StringComparison.Ordinal) ||
                     word.EndsWith("ing", StringComparison.Ordinal)))
                {
                    boost += 0.15;
                }
                return Math.Min(boost, 1.5);
            }

            case "noun":
            {
                var boost = 0d;
                if (Determiners.Contains(previous)) boost += 1.0;
                if (BeForms.Contains(next)) boost += 0.6;
                if (Prepositions.Contains(previous)) boost += 0.15;
                if (string.Equals(next, "of", StringComparison.OrdinalIgnoreCase)) boost += 0.2;
                return Math.Min(boost, 1.3);
            }

            case "adjective":
            {
                var boost = 0d;
                if (BeForms.Contains(previous)) boost += 0.85;
                if (Intensifiers.Contains(previous)) boost += 0.45;
                if (Determiners.Contains(next)) boost += 0.15;
                return Math.Min(boost, 1.1);
            }

            case "adverb":
                return Subjects.Contains(previous) || ModalMarkers.Contains(previous) ? 0.1 : 0;

            default:
                return 0;
        }
    }

    private static double FallbackPosBoost(string pos, string sentence)
    {
        var lower = sentence.ToLowerInvariant();

        return pos switch
        {
            "verb" when ContainsAny(lower, " to ", " will ", " can ", " should ", " must ", " may ", " might ", " did ", " does ", " do ", " not ") => 0.55,
            "adjective" when ContainsAny(lower, " very ", " so ", " too ", " really ", " quite ") => 0.35,
            "adverb" => 0.15,
            _ => 0
        };
    }

    /// <summary>
    /// Với tính từ, phân biệt nghĩa dành cho người/hệ thống và nghĩa dành cho
    /// vật liệu/vật thể. Ví dụ "She stayed resilient after every setback" là
    /// nghĩa con người, còn "The material is resilient" là nghĩa vật lý.
    /// Chỉ chấm khi tính từ đi sau một động từ nối và chủ ngữ là người.
    /// </summary>
    private static double SubjectSenseBoost(
        string sentence, SenseCandidate candidate, string targetWord)
    {
        if (candidate.PartOfSpeech != "adjective")
        {
            return 0;
        }

        var tokens = TextUtil.Tokenize(sentence);
        var targetTokens = TextUtil.Tokenize(targetWord);
        if (tokens.Count == 0 || targetTokens.Count == 0)
        {
            return 0;
        }

        var index = -1;
        for (var i = 0; i < tokens.Count; i++)
        {
            if (string.Equals(tokens[i], targetTokens[0], StringComparison.OrdinalIgnoreCase))
            {
                index = i;
                break;
            }
        }

        if (index < 1)
        {
            return 0;
        }

        var cursor = index - 1;
        while (cursor >= 0 && Intensifiers.Contains(tokens[cursor]))
        {
            cursor--;
        }

        if (cursor < 0 || !LinkVerbs.Contains(tokens[cursor]))
        {
            return 0;
        }

        var personSubject = tokens
            .Take(cursor)
            .Any(token => PersonWords.Contains(token));
        if (!personSubject)
        {
            return 0;
        }

        var definition = candidate.DefinitionEn.ToLowerInvariant();
        var boost = 0d;
        if (ContainsAny(definition, "person", "people", "someone", "human", "organism", "system"))
        {
            boost += 0.5;
        }

        if (ContainsAny(definition, "object", "substance", "material", "thing", "physical"))
        {
            boost -= 0.4;
        }

        return boost;
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
