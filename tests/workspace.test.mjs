import { test } from "node:test";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
process.loadEnvFile(".env.local");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3010";
test("shared workspace persists and protects collaborative changes", async () => {
  assert.equal((await fetch(base + "/api/workspace")).status, 401);
  assert.equal(
    (await fetch(base + "/api/workspace", { method: "POST" })).status,
    401,
  );
  assert.equal(
    (await fetch(base + "/projekte", { redirect: "manual" })).status,
    307,
  );
  const login = await fetch(base + "/api/login", {
    method: "POST",
    redirect: "manual",
    headers: {
      Origin: base,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      password: process.env.SITE_PASSWORD,
      next: "projekte",
    }),
  });
  assert.match(login.headers.get("location"), /\/projekte$/);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const post = (data, origin = base) =>
    fetch(base + "/api/workspace", {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  const get = async (id) => {
    const r = await fetch(base + "/api/workspace" + (id ? "?id=" + id : ""), {
      headers: { Cookie: cookie },
    });
    assert.equal(r.status, 200);
    return r.json();
  };
  assert.equal((await post({}, "https://example.com")).status, 403);
  assert.equal((await post({ action: "create", title: "" })).status, 400);
  const fields = {
    title: "Automatischer Funktionstest",
    description: "Temporäre Testdaten",
    kind: "idea",
    owner: "QA",
    due: "2026-10-15",
  };
  const created = await post({ action: "create", ...fields });
  assert.equal(created.status, 201);
  const { id } = await created.json();
  try {
    let detail = await get(id);
    assert.equal(detail.item.title, fields.title);
    assert((await get()).items.some((i) => i.id === id));
    assert.equal(
      (
        await post({
          action: "update",
          ...fields,
          kind: "project",
          id,
          version: 1,
          status: "active",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await post({
          action: "update",
          ...fields,
          id,
          version: 1,
          status: "active",
        })
      ).status,
      409,
    );
    const t = await post({
      action: "task-create",
      itemId: id,
      title: "Prüfen",
      assignee: "QA",
      due: "",
    });
    assert.equal(t.status, 201);
    const task = await t.json();
    assert.equal(
      (
        await post({
          action: "task-update",
          id: task.id,
          version: 1,
          title: "Prüfen",
          assignee: "QA",
          due: "",
          status: "done",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await post({
          action: "comment",
          itemId: id,
          author: "QA",
          body: "Gemeinsam gespeichert.",
        })
      ).status,
      201,
    );
    detail = await get(id);
    assert.equal(detail.item.task_count, 1);
    assert.equal(detail.item.done_count, 1);
    assert.equal(detail.comments[0].body, "Gemeinsam gespeichert.");
    assert.equal(
      (
        await post({
          action: "update",
          ...fields,
          id,
          version: 2,
          status: "archived",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await post({
          action: "task-create",
          itemId: id,
          title: "Nicht möglich",
          assignee: "",
          due: "",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await post({
          action: "update",
          ...fields,
          id,
          version: 3,
          status: "active",
        })
      ).status,
      200,
    );
  } finally {
    const sql = neon(process.env.DATABASE_URL);
    await sql`DELETE FROM e23_work_items WHERE id=${id}`;
  }
});
