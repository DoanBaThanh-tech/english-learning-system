namespace EnglishApp.Api.Data.Seed;

public sealed record SeedScenario(string Name, string LevelCode, string SystemPrompt);

public sealed record SeedPassage(string Title, string Topic, string LevelCode, string Body);

public static class ContentSeed
{
    public static IReadOnlyList<SeedScenario> Scenarios { get; } = new List<SeedScenario>
    {
        new("Gọi đồ uống ở quán cà phê", "A2",
            "You are a friendly barista at a small café in Ho Chi Minh City. Role-play taking the learner's order in simple English. " +
            "Use A2 vocabulary, ask one question at a time, and gently correct serious mistakes in the JSON corrections field. " +
            "Stay in character, keep replies under 70 words, and end with a natural follow-up question."),
        new("Phỏng vấn xin việc IT", "B1",
            "You are an IT recruiter interviewing a junior developer. Ask one behavioral or technical question at a time. " +
            "Use clear B1-B2 English. In the corrections field, point out grammar or word-choice issues, but keep the conversation encouraging. " +
            "Do not reveal the whole interview script. End each reply with one question."),
        new("Nhập cảnh ở sân bay", "A2",
            "You are an immigration officer at Tan Son Nhat airport. Ask short, realistic questions about the learner's trip, " +
            "luggage, and length of stay. Keep language simple and repeat or rephrase if needed. Correct only important errors."),
        new("Small talk với đồng nghiệp", "B1",
            "You are a friendly colleague chatting before a meeting. Topics: weekend, weather, commuting, food, and light work news. " +
            "Keep the tone warm and casual. Ask follow-up questions and suggest a more natural phrase when the learner's sentence sounds unnatural."),
        new("Thuyết trình dự án", "B2",
            "You are a project stakeholder listening to a short presentation. Ask clarifying questions about goals, users, timeline, and risks. " +
            "Give concise feedback on clarity and signposting language. Keep the role-play professional and realistic.")
    };

    public static IReadOnlyList<SeedPassage> Passages { get; } = new List<SeedPassage>
    {
        new("A Small Café in District 1", "Life & work", "B1",
            "Linh runs a small café on a quiet street in District 1. She opens the shop at six thirty, " +
            "long before most offices wake up. The café is light and airy, with wooden tables and a few plants near the window. " +
            "Regular customers order the same drink every morning, but Linh still remembers how each person likes it. " +
            "She says the secret is not the coffee itself; it is the feeling that people are welcome. " +
            "On busy days, she takes orders, makes drinks, and trains new staff at the same time. " +
            "Running a business is hard, she admits, but the small conversations with customers keep her going."),
        new("The Road to a First Job", "Career", "B1",
            "Minh is a final-year student looking for his first job in software testing. Last month, he applied to twelve companies " +
            "and received two interviews. Before the first interview, he booked a quiet room in the library, checked his laptop, " +
            "and practiced explaining a project he had built with his classmates. The interviewer asked about a bug he had found " +
            "and how he had fixed it. Minh did not know every answer, but he explained his thinking clearly. " +
            "A week later, he got the offer. His advice to other students is simple: prepare examples, not perfect sentences."),
        new("A Weekend Outside the City", "Travel", "A2",
            "Last weekend, my friend and I took a bus to a small town outside the city. We left early in the morning " +
            "because we wanted to avoid traffic. The weather was cool and the sky was clear. We walked along the river bank, " +
            "ate noodles at a local market, and watched farmers work in the fields. In the afternoon, we sat under a tree " +
            "and listened to the sounds around us. There was no music, only birds and water. It was a simple trip, but it was one of " +
            "the best weekends of the year. Sometimes you do not need a long holiday to feel fresh again.")
    };
}
