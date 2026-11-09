"""Skyword API smoke test end-to-end.

Chạy API trước:
    dotnet run --project EnglishApp.Api --urls http://localhost:5041
Sau đó:
    python smoke_test.py
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

BASE = os.environ.get("API_BASE", "http://localhost:5041").rstrip("/")

passed = 0
failed = 0
failures: list[str] = []


def call(
    method: str,
    path: str,
    body: Any = None,
    token: str | None = None,
    timeout: int = 90,
) -> tuple[int, Any]:
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = "Bearer " + token

    request = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            return error.code, json.loads(raw) if raw else None
        except json.JSONDecodeError:
            return error.code, raw


def check(name: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        failures.append(f"{name} {detail}")
        print(f"  FAIL  {name}  {detail}")


def expect(name: str, status: int, wanted: int | tuple[int, ...], body: Any = None) -> Any:
    wanted_tuple = wanted if isinstance(wanted, tuple) else (wanted,)
    check(name, status in wanted_tuple, f"status={status} body={str(body)[:300]}")
    return body


def section(title: str) -> None:
    print(f"\n== {title} ==")


def main() -> int:
    section("Health & auth")
    status, body = call("GET", "/health")
    expect("health", status, 200, body)

    status, _ = call("GET", "/api/users/me/dashboard")
    check("dashboard requires auth", status == 401, f"status={status}")

    status, login = call(
        "POST",
        "/api/auth/login",
        {"email": "demo@skyword.dev", "password": "Demo@12345"},
    )
    expect("demo login", status, 200, login)
    check("demo has seeded words", (login or {}).get("user", {}).get("levelCode") == "B1", str(login)[:200])

    email = "qa@skyword.dev"
    status, registered = call(
        "POST",
        "/api/auth/register",
        {
            "email": email,
            "password": "Qa@123456",
            "displayName": "QA Learner",
            "currentLevelId": 3,
            "timeZoneId": "SE Asia Standard Time",
        },
    )
    if status == 409:
        status, registered = call("POST", "/api/auth/login", {"email": email, "password": "Qa@123456"})
        expect("qa login (existing)", status, 200, registered)
    else:
        expect("qa register", status, 200, registered)

    token = registered["accessToken"]
    refresh = registered["refreshToken"]

    status, body = call(
        "POST",
        "/api/auth/register",
        {"email": email, "password": "Qa@123456", "displayName": "Duplicate"},
    )
    check("duplicate email rejected", status == 409, f"status={status}")

    status, profile = call(
        "PUT",
        "/api/users/me",
        {
            "displayName": "QA Learner",
            "avatarUrl": None,
            "currentLevelId": 3,
            "dailyWordGoal": 10,
            "timeZoneId": "SE Asia Standard Time",
        },
        token,
    )
    expect("update profile", status, 200, profile)
    check("goal updated", (profile or {}).get("dailyWordGoal") == 10, str(profile)[:200])

    status, refs = call("GET", "/api/reference/all", token=token)
    expect("reference data", status, 200, refs)
    check("5 skills", len((refs or {}).get("skills", [])) == 5)

    section("Dictionary & context")
    status, search = call("GET", "/api/dictionary/search?q=run&limit=5", token=token)
    expect("search run", status, 200, search)
    check("search result", any(item["lemma"] == "run" for item in (search or [])), str(search)[:200])

    status, word = call("GET", "/api/dictionary/words/run", token=token)
    expect("word run", status, 200, word)
    check("run has 4 senses", len((word or {}).get("senses", [])) == 4, str(word)[:200])
    run_word_id = (word or {}).get("id")

    status, context = call(
        "POST",
        "/api/dictionary/context-lookup",
        {"word": "runs", "sentence": "She runs a small café in District 1.", "translateSentence": True},
        token,
    )
    expect("context lookup runs", status, 200, context)
    check("context sense = điều hành", (context or {}).get("meaningVi") == "điều hành", str(context)[:300])
    check("context confidence >= 90", (context or {}).get("confidence", 0) >= 90)
    check("sentence translated", "điều hành" in ((context or {}).get("sentenceTranslation") or ""))

    status, translated = call(
        "POST",
        "/api/dictionary/translate",
        {"text": "She runs a small café in District 1.", "from": "en", "to": "vi"},
        token,
    )
    expect("translate sentence", status, 200, translated)
    check("translation quality", "điều hành" in ((translated or {}).get("translatedText") or ""))

    status, wod = call("GET", "/api/dictionary/word-of-the-day", token=token)
    expect("word of the day", status, 200, wod)

    status, enriched = call("GET", "/api/dictionary/words/serendipity", token=token)
    check("external dictionary enrich", status == 200 and len((enriched or {}).get("senses", [])) > 0,
          f"status={status} body={str(enriched)[:300]}")

    section("Vocabulary")
    status, stats = call("GET", "/api/vocabulary/stats", token=token)
    expect("vocabulary stats", status, 200, stats)

    status, folder = call("POST", "/api/vocabulary/folders", {"name": "QA Folder"}, token)
    expect("create folder", status, 200, folder)
    folder_id = (folder or {}).get("id")

    status, tag = call("POST", "/api/vocabulary/tags", {"name": "qa"}, token)
    expect("create tag", status, 200, tag)
    tag_id = (tag or {}).get("id")

    status, added = call(
        "POST",
        "/api/vocabulary/words/by-lemma",
        {
            "lemma": "bank",
            "contextSentence": "We sat on the river bank and watched the sunset.",
            "folderId": folder_id,
            "note": "context test",
            "tagIds": [tag_id],
        },
        token,
    )
    expect("add word by lemma", status, 200, added)
    check("bank context sense = bờ sông", (added or {}).get("meaningVi") == "bờ sông", str(added)[:300])
    user_word_id = (added or {}).get("id")

    status, updated = call(
        "PUT",
        f"/api/vocabulary/words/{user_word_id}",
        {"folderId": None, "note": "updated note", "status": "learning", "tagIds": [tag_id]},
        token,
    )
    expect("update user word", status, 200, updated)
    check("note updated", (updated or {}).get("note") == "updated note")

    status, listing = call("GET", "/api/vocabulary/words?page=1&pageSize=50", token=token)
    expect("list vocabulary", status, 200, listing)
    check("vocabulary has bank", any(item["lemma"] == "bank" for item in (listing or {}).get("items", [])))

    status, due = call("GET", "/api/vocabulary/words/due?limit=20", token=token)
    expect("due words", status, 200, due)

    # Thêm vài từ cho phiên học
    for lemma, sentence in [
        ("run", "I run every morning."),
        ("order", "I ordered a coffee and a sandwich."),
        ("light", "This backpack is very light."),
        ("work", "I have a lot of work today."),
    ]:
        status, result = call(
            "POST",
            "/api/vocabulary/words/by-lemma",
            {"lemma": lemma, "contextSentence": sentence},
            token,
        )
        check(f"add {lemma}", status == 200, f"status={status} {str(result)[:200]}")

    section("Study & SRS")
    status, session = call(
        "POST",
        "/api/study/sessions",
        {"mode": "review", "limit": 10},
        token,
    )
    expect("start review session", status, 200, session)
    session_id = (session or {}).get("id")

    status, card = call("GET", f"/api/study/sessions/{session_id}/next?type=multiple_choice", token=token)
    expect("next review card", status, 200, card)
    check("card has options", len((card or {}).get("options", [])) >= 2, str(card)[:300])

    if status == 200:
        status, result = call(
            "POST",
            f"/api/study/sessions/{session_id}/answers",
            {
                "userWordId": card["userWordId"],
                "exerciseTypeCode": "multiple_choice",
                "userAnswer": card["meaningVi"],
                "responseMs": 1800,
            },
            token,
        )
        expect("answer correct", status, 200, result)
        check("answer graded correct", (result or {}).get("isCorrect") is True, str(result)[:300])

        status, card2 = call("GET", f"/api/study/sessions/{session_id}/next?type=multiple_choice", token=token)
        if status == 200 and card2:
            status, wrong = call(
                "POST",
                f"/api/study/sessions/{session_id}/answers",
                {
                    "userWordId": card2["userWordId"],
                    "exerciseTypeCode": "multiple_choice",
                    "userAnswer": "definitely-wrong",
                    "responseMs": 9000,
                },
                token,
            )
            expect("answer wrong", status, 200, wrong)
            check("wrong graded false", (wrong or {}).get("isCorrect") is False, str(wrong)[:300])

    status, summary = call("POST", f"/api/study/sessions/{session_id}/finish", {}, token)
    expect("finish session", status, 200, summary)
    check("summary has answers", (summary or {}).get("answered", 0) >= 1, str(summary)[:300])

    status, learn = call("POST", "/api/study/sessions", {"mode": "learn", "limit": 5}, token)
    expect("start learn session", status, 200, learn)
    learn_id = (learn or {}).get("id")
    status, flash = call("GET", f"/api/study/sessions/{learn_id}/next?type=flashcard", token=token)
    expect("flash card", status, 200, flash)
    if status == 200:
        status, rated = call(
            "POST",
            f"/api/study/sessions/{learn_id}/answers",
            {
                "userWordId": flash["userWordId"],
                "exerciseTypeCode": "flashcard",
                "userAnswer": "easy",
                "quality": 5,
                "responseMs": 1200,
            },
            token,
        )
        expect("flash rating", status, 200, rated)
    status, learned = call("POST", f"/api/study/sessions/{learn_id}/finish", {}, token)
    expect("finish learn session", status, 200, learned)

    section("Stats")
    for path in [
        "/api/stats/overview",
        "/api/stats/daily",
        "/api/stats/heatmap?days=30",
        "/api/stats/skills",
    ]:
        status, body = call("GET", path, token=token)
        expect(path, status, 200, body)

    status, scores = call("POST", "/api/stats/skills/recalculate", {}, token)
    expect("recalculate skills", status, 200, scores)

    section("Pronunciation")
    status, attempt = call(
        "POST",
        "/api/pronunciation/analyze",
        {
            "wordId": run_word_id,
            "referenceText": "She runs a small café in District 1.",
            "transcript": "She run a small cafe in District one",
        },
        token,
    )
    expect("pronunciation analyze", status, 200, attempt)
    check("pronunciation has score", 0 <= (attempt or {}).get("overallScore", -1) <= 100, str(attempt)[:300])
    check("pronunciation flags mistakes", any(not w["correct"] for w in (attempt or {}).get("words", [])), str(attempt)[:300])
    check("pronunciation phoneme tips", len((attempt or {}).get("phonemes", [])) > 0, str(attempt)[:300])

    status, attempts = call("GET", "/api/pronunciation/attempts", token=token)
    expect("pronunciation history", status, 200, attempts)
    status, pron_summary = call("GET", "/api/pronunciation/summary", token=token)
    expect("pronunciation summary", status, 200, pron_summary)

    section("Chat & errors")
    status, scenarios = call("GET", "/api/chat/scenarios", token=token)
    expect("chat scenarios", status, 200, scenarios)
    scenario_id = (scenarios or [{}])[0].get("id")

    status, chat = call(
        "POST",
        "/api/chat/sessions",
        {"scenarioId": scenario_id, "title": "QA role-play"},
        token,
    )
    expect("create chat session", status, 200, chat)
    chat_id = (chat or {}).get("id")

    status, sent = call(
        "POST",
        f"/api/chat/sessions/{chat_id}/messages",
        {"content": "i very like coffee. I want a coffee with milk please."},
        token,
    )
    expect("send chat message", status, 200, sent)
    check("chat corrections", len((sent or {}).get("corrections", [])) >= 1, str(sent)[:400])
    check("chat assistant reply", bool((sent or {}).get("assistantMessage", {}).get("content")), str(sent)[:300])
    check("chat offline fallback", (sent or {}).get("aiUsed") is False, str(sent)[:200])

    status, detail = call("GET", f"/api/chat/sessions/{chat_id}", token=token)
    expect("chat detail", status, 200, detail)
    check("chat has 2 messages", len((detail or {}).get("messages", [])) == 2)

    status, error_summary = call("GET", "/api/errors/summary", token=token)
    expect("error summary", status, 200, error_summary)
    check("errors recorded", (error_summary or {}).get("total", 0) >= 1, str(error_summary)[:400])

    status, error_list = call("GET", "/api/errors?resolved=false&limit=10", token=token)
    expect("error list", status, 200, error_list)
    if error_list:
        status, resolved = call(
            "PUT",
            f"/api/errors/{error_list[0]['id']}/resolve",
            {"isResolved": True},
            token,
        )
        expect("resolve error", status, 200, resolved)
        check("error resolved flag", (resolved or {}).get("isResolved") is True)

    status, _ = call("DELETE", f"/api/chat/sessions/{chat_id}", token=token)
    expect("delete chat session", status, 204, _)
    status, gone = call("GET", f"/api/chat/sessions/{chat_id}", token=token)
    expect("deleted chat session is gone", status, 404, gone)

    section("Reading")
    status, passages = call("GET", "/api/reading/passages", token=token)
    expect("reading list", status, 200, passages)
    check("seeded passages", len(passages or []) >= 3)
    passage_id = (passages or [{}])[0].get("id")

    status, passage = call("GET", f"/api/reading/passages/{passage_id}", token=token)
    expect("passage detail", status, 200, passage)
    status, lens = call("GET", f"/api/reading/passages/{passage_id}/lens", token=token)
    expect("passage lens", status, 200, lens)
    check("lens segments", len((lens or {}).get("segments", [])) > 10)

    status, _ = call("PUT", f"/api/reading/passages/{passage_id}/progress", {"progressPct": 55}, token)
    check("update progress", status == 204, f"status={status}")

    section("Sources & lessons")
    content = (
        "I run a small café in District 1. I book a table and order coffee for my friends. "
        "I study English at work because I want a better job. On Sunday I play football "
        "and listen to music with my family. A good book and a light breakfast make a fine morning."
    )
    status, source = call(
        "POST",
        "/api/sources",
        {
            "sourceType": "text",
            "title": "QA source",
            "content": content,
            "fetchContentFromUrl": False,
        },
        token,
    )
    expect("create source", status, 200, source)
    source_id = (source or {}).get("id")

    status, lesson = call(
        "POST",
        f"/api/sources/{source_id}/generate-lesson",
        {"targetWords": 6, "levelId": 3, "saveToNotebook": True, "enrichUnknown": False},
        token,
    )
    expect("generate lesson", status, 200, lesson)
    check("lesson has items", len((lesson or {}).get("items", [])) >= 3, str(lesson)[:400])
    lesson_id = (lesson or {}).get("id")

    status, lessons = call("GET", "/api/lessons", token=token)
    expect("lesson list", status, 200, lessons)
    status, lesson_detail = call("GET", f"/api/lessons/{lesson_id}", token=token)
    expect("lesson detail", status, 200, lesson_detail)

    section("Plans")
    status, plan = call(
        "POST",
        "/api/plans/generate",
        {"days": 7, "minutesPerDay": 20, "focusSkill": "speaking"},
        token,
    )
    expect("generate plan", status, 200, plan)
    check("plan has tasks", len((plan or {}).get("tasks", [])) > 0, str(plan)[:300])
    plan_id = (plan or {}).get("id")
    task_id = (plan or {}).get("tasks", [{}])[0].get("id")

    status, completed = call(
        "PUT",
        f"/api/plans/{plan_id}/tasks/{task_id}/complete",
        {"isDone": True},
        token,
    )
    expect("complete plan task", status, 200, completed)
    check("task done", (completed or {}).get("isDone") is True)

    status, plans = call("GET", "/api/plans", token=token)
    expect("plan list", status, 200, plans)
    status, plan_detail = call("GET", f"/api/plans/{plan_id}", token=token)
    expect("plan detail", status, 200, plan_detail)

    section("Dashboard & token rotation")
    status, dashboard = call("GET", "/api/users/me/dashboard", token=token)
    expect("dashboard", status, 200, dashboard)
    check("dashboard totals", (dashboard or {}).get("totalWords", 0) >= 5, str(dashboard)[:300])

    status, refreshed = call("POST", "/api/auth/refresh", {"refreshToken": refresh})
    expect("refresh token", status, 200, refreshed)
    new_token = (refreshed or {}).get("accessToken")
    new_refresh = (refreshed or {}).get("refreshToken")

    status, me = call("GET", "/api/users/me", token=new_token)
    expect("new access token works", status, 200, me)

    status, _ = call("POST", "/api/auth/logout", {"refreshToken": new_refresh}, new_token)
    check("logout", status == 204, f"status={status}")

    status, _ = call("POST", "/api/auth/refresh", {"refreshToken": new_refresh})
    check("revoked refresh rejected", status == 401, f"status={status}")

    print("\n" + "=" * 60)
    print(f"PASSED: {passed}   FAILED: {failed}")
    if failures:
        print("\nFailures:")
        for failure in failures:
            print(" -", failure)
    print("=" * 60)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
