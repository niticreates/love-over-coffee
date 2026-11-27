"use client";
import { useState } from "react";
import { postJSON } from "./api";
import { Field, TextArea, TextInput } from "./Field";

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    setFormError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const r = await postJSON("/api/contact", f);
    if (r.ok) return setState("sent");
    setState("idle");
    setErrors(r.error.fields ?? {});
    setFormError(r.error.message);
  }

  if (state === "sent")
    return (
      <div className="rounded-[24px] border border-oat bg-paper p-8">
        <p className="font-display text-3xl">Thank you.</p>
        <p className="mt-3 text-muted">Your message has reached the café. We&apos;ll get back to you soon.</p>
      </div>
    );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <Field label="Your name" name="name" error={errors.name}><TextInput name="name" autoComplete="name" required error={errors.name} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mobile" name="phone" error={errors.phone}><TextInput name="phone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} /></Field>
        <Field label="Email" name="email" error={errors.email}><TextInput name="email" type="email" autoComplete="email" error={errors.email} /></Field>
      </div>
      <Field label="Message" name="message" error={errors.message}><TextArea name="message" required maxLength={2000} error={errors.message} /></Field>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <button className="btn btn-dark justify-self-start" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
