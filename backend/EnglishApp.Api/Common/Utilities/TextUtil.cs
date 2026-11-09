using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace EnglishApp.Api.Common.Utilities;

public static partial class TextUtil
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "an", "the", "and", "or", "but", "if", "then", "so", "because", "as", "of", "to", "in", "on",
        "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before",
        "after", "above", "below", "from", "up", "down", "out", "off", "over", "under", "again", "further",
        "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
        "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "than", "too", "very",
        "can", "will", "just", "should", "now", "is", "am", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "having", "do", "does", "did", "doing", "would", "could", "ought", "i", "you",
        "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
        "their", "this", "that", "these", "those", "what", "which", "who", "whom", "whose", "also", "get"
    };

    [GeneratedRegex(@"[A-Za-z][A-Za-z'\-]*")]
    private static partial Regex WordRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SpaceRegex();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"[^\w\s'\-]")]
    private static partial Regex AnswerPunctuationRegex();

    public static string Normalize(string? value) =>
        SpaceRegex().Replace((value ?? string.Empty).Trim().ToLowerInvariant(), " ");

    public static string NormalizeAnswer(string? value)
    {
        var text = Normalize(value);
        text = AnswerPunctuationRegex().Replace(text, " ");
        return SpaceRegex().Replace(text, " ").Trim();
    }

    public static IReadOnlyList<string> Tokenize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return Array.Empty<string>();
        }

        return WordRegex().Matches(text.ToLowerInvariant())
            .Select(m => m.Value)
            .ToList();
    }

    public static IReadOnlyList<string> ContentTokens(string? text) =>
        Tokenize(text).Where(t => t.Length > 1 && !StopWords.Contains(t)).Distinct().ToList();

    public static bool IsStopWord(string token) => StopWords.Contains(token);

    public static byte[] HashSentence(string sentence) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(Normalize(sentence)));

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    public static string StripHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var withoutScripts = Regex.Replace(html, @"<(script|style)[^>]*>.*?</\1>",
            " ", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        var text = HtmlTagRegex().Replace(withoutScripts, " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        return SpaceRegex().Replace(text, " ").Trim();
    }

    public static string Truncate(string? value, int maxLength) =>
        string.IsNullOrEmpty(value) || value.Length <= maxLength ? value ?? string.Empty : value[..maxLength];

    public static int Levenshtein(string a, string b)
    {
        if (a.Length == 0) return b.Length;
        if (b.Length == 0) return a.Length;

        var previous = new int[b.Length + 1];
        var current = new int[b.Length + 1];

        for (var j = 0; j <= b.Length; j++) previous[j] = j;

        for (var i = 1; i <= a.Length; i++)
        {
            current[0] = i;
            for (var j = 1; j <= b.Length; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                current[j] = Math.Min(Math.Min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + cost);
            }

            (previous, current) = (current, previous);
        }

        return previous[b.Length];
    }

    /// <summary>
    /// Rút gọn từ tiếng Anh thường gặp để tra cứu: runs -> run, studies -> study,
    /// running -> run, stopped -> stop. Không thay thế lemmatizer đầy đủ.
    /// </summary>
    public static IReadOnlyList<string> LemmaCandidates(string raw)
    {
        var word = Normalize(raw);
        var candidates = new List<string> { word };

        void Add(string value)
        {
            if (!string.IsNullOrWhiteSpace(value) && value.Length > 1 && !candidates.Contains(value))
            {
                candidates.Add(value);
            }
        }

        if (word.EndsWith("ies") && word.Length > 4) Add(word[..^3] + "y");
        if (word.EndsWith("es") && word.Length > 3) Add(word[..^2]);
        if (word.EndsWith("s") && word.Length > 2) Add(word[..^1]);
        if (word.EndsWith("ied") && word.Length > 4) Add(word[..^3] + "y");
        if (word.EndsWith("ed") && word.Length > 3)
        {
            Add(word[..^2]);
            Add(word[..^1]);
        }
        if (word.EndsWith("ing") && word.Length > 4)
        {
            var stem = word[..^3];
            Add(stem);
            Add(stem + "e");
            if (stem.Length > 2 && stem[^1] == stem[^2]) Add(stem[..^1]);
        }

        return candidates;
    }

    /// <summary>Lấy câu chứa từ khóa, dùng làm ngữ cảnh cho bài học và tra nghĩa.</summary>
    public static string SentenceAround(string? text, string word, int maxLength = 400)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var sentences = Regex.Split(text, @"(?<=[.!?])\s+");
        var match = sentences.FirstOrDefault(s => s.Contains(word, StringComparison.OrdinalIgnoreCase));
        if (match is not null)
        {
            return Truncate(match.Trim(), maxLength);
        }

        return Truncate(text.Trim(), maxLength);
    }

    public static string SimplifyMeaning(string? meaning)
    {
        if (string.IsNullOrWhiteSpace(meaning))
        {
            return string.Empty;
        }

        var first = meaning.Split(';', '.', '\n')[0].Trim();
        return first.Length > 0 ? first : meaning.Trim();
    }
}
