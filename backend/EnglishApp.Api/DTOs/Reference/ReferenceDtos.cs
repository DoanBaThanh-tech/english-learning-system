namespace EnglishApp.Api.DTOs.Reference;

public sealed record LevelDto(byte Id, string Code, string Name);
public sealed record PartOfSpeechDto(byte Id, string Code, string NameVi);
public sealed record ExerciseTypeDto(byte Id, string Code, string NameVi);
public sealed record SkillDto(byte Id, string Code, string NameVi);
