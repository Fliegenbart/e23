import { test } from "node:test";
import assert from "node:assert/strict";
import { getDemoConfig } from "../lib/chat-demo/config.ts";
test("demo configuration fails closed for disabled, unsafe, same-origin or invalid epoch values", () => {
  const keys = [
    "CHAT_DEMO_ENABLED",
    "CHAT_DEMO_ORIGIN",
    "CHAT_DEMO_E23_ORIGIN",
    "CHAT_DEMO_AUTH_EPOCH",
  ];
  const old = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  try {
    Object.assign(process.env, {
      CHAT_DEMO_ENABLED: "false",
      CHAT_DEMO_ORIGIN: "https://demo.example.test",
      CHAT_DEMO_E23_ORIGIN: "https://e23.example.test",
      CHAT_DEMO_AUTH_EPOCH: "1",
    });
    assert.equal(getDemoConfig(), null);
    process.env.CHAT_DEMO_ENABLED = "true";
    assert.equal(getDemoConfig().epoch, 1);
    for (const origin of [
      "javascript:alert(1)",
      "https://secret@demo.example.test",
      "https://demo.example.test/path",
      "http://public.example.test",
      "https://e23.example.test",
    ]) {
      process.env.CHAT_DEMO_ORIGIN = origin;
      assert.equal(getDemoConfig(), null);
    }
    process.env.CHAT_DEMO_ORIGIN = "http://127.0.0.1:4310";
    process.env.CHAT_DEMO_E23_ORIGIN = "http://127.0.0.1:3010";
    assert(getDemoConfig());
    process.env.CHAT_DEMO_AUTH_EPOCH = "NaN";
    assert.equal(getDemoConfig(), null);
  } finally {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  }
});
