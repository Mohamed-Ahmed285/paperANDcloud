"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ApiError } from "@/lib/api";
import { ItemInputSchema, normalizeTags, type ItemInput } from "@/lib/schemas";
import { CONTENT_TYPES, type Collection, type ContentType, type SavedItem } from "@/lib/types";
import { TagBadge } from "./TagBadge";
import { TYPE_META } from "./typeMeta";
import { Button } from "./ui/Button";
import { Field, Input, Select, Textarea, describedBy, inputClass } from "./ui/Field";

interface Values {
  title: string;
  content: string;
  url: string;
  description: string;
  author: string;
  source: string;
  filename: string;
  mimeType: string;
  size: string;
}

const EMPTY: Values = { title: "", content: "", url: "", description: "", author: "", source: "", filename: "", mimeType: "", size: "" };

function fromItem(item?: SavedItem): Values {
  if (!item) return EMPTY;
  return {
    title: item.title ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    description: item.description ?? "",
    author: item.author ?? "",
    source: item.source ?? "",
    filename: item.filename ?? "",
    mimeType: item.mimeType ?? "",
    size: item.size !== undefined ? String(item.size) : "",
  };
}

export function ItemForm({
  item,
  collections,
  knownTags,
  defaultCollectionId,
  onSubmit,
  onCancel,
}: {
  item?: SavedItem;
  collections: Collection[];
  knownTags: string[];
  defaultCollectionId?: string;
  onSubmit: (input: ItemInput) => Promise<void>;
  onCancel: () => void;
}) {
  const editing = !!item;
  const [type, setType] = useState<ContentType>(item?.type ?? "link");
  const [v, setV] = useState<Values>(() => fromItem(item));
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [collectionId, setCollectionId] = useState(item?.collectionId ?? defaultCollectionId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const err = (k: string) => errors[k];
  const common = (k: keyof Values, extra?: string) => ({
    id: `f-${k}`,
    value: v[k],
    onChange: set(k),
    "aria-invalid": !!err(k),
    "aria-describedby": describedBy(`f-${k}`, err(k), extra),
  });

  function commitTags(draft: string) {
    const parts = draft.split(",");
    if (parts.every((p) => !p.trim())) return tags;
    const next = normalizeTags([...tags, ...parts]);
    setTags(next);
    setTagDraft("");
    return next;
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTags(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function pickFile(file?: File) {
    if (!file) return;
    setV((p) => ({ ...p, filename: file.name, mimeType: file.type, size: String(file.size) }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const finalTags = commitTags(tagDraft);
    const size = v.size.trim() === "" ? undefined : Number(v.size);
    const parsed = ItemInputSchema.safeParse({
      type,
      title: v.title,
      content: v.content,
      url: v.url,
      description: v.description,
      author: v.author,
      source: v.source,
      filename: v.filename,
      mimeType: v.mimeType,
      size: Number.isFinite(size) ? size : undefined,
      tags: finalTags,
      collectionId: collectionId || null,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      setFormError(undefined);
      document.getElementById(`f-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setErrors({});
    setFormError(undefined);
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch (ex) {
      if (ex instanceof ApiError) {
        setErrors(ex.fields ?? {});
        setFormError(ex.message);
      } else {
        setFormError("Couldn't save. Your changes are still here, so you can try again.");
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!editing && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">What are you saving?</legend>
          <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-surface p-1">
            {CONTENT_TYPES.map((t) => {
              const Icon = TYPE_META[t].icon;
              return (
                <label key={t} className={`flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${type === t ? "bg-card text-accent-strong shadow-[0_0_0_1px_var(--border)]" : "text-muted hover:text-ink"}`}>
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => { setType(t); setErrors({}); }} className="sr-only" />
                  <Icon size={16} aria-hidden />
                  <span>{TYPE_META[t].label.split(" ")[0]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {type === "link" && (
        <>
          <Field label="URL" htmlFor="f-url" error={err("url")}><Input {...common("url")} type="url" inputMode="url" placeholder="https://example.com/article" autoFocus /></Field>
          <Field label="Title" htmlFor="f-title" optional error={err("title")}><Input {...common("title")} placeholder="Page title" /></Field>
          <Field label="Description" htmlFor="f-description" optional error={err("description")}><Textarea {...common("description")} rows={2} /></Field>
        </>
      )}

      {type === "text" && (
        <>
          <Field label="Title" htmlFor="f-title" optional error={err("title")}><Input {...common("title")} /></Field>
          <Field label="Text" htmlFor="f-content" error={err("content")}><Textarea {...common("content")} rows={6} autoFocus /></Field>
        </>
      )}

      {type === "quote" && (
        <>
          <Field label="Quote" htmlFor="f-content" error={err("content")}><Textarea {...common("content")} rows={4} autoFocus className="font-serif text-[17px]" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" htmlFor="f-author" optional error={err("author")}><Input {...common("author")} /></Field>
            <Field label="Source" htmlFor="f-source" optional error={err("source")}><Input {...common("source")} placeholder="Book, article, talk…" /></Field>
          </div>
        </>
      )}

      {type === "media" && (
        <>
          <Field label="Image or media URL" htmlFor="f-url" error={err("url")} hint="Direct link to an image or video file."><Input {...common("url", "hint")} type="url" inputMode="url" placeholder="https://…/photo.jpg" autoFocus /></Field>
          <Field label="Caption" htmlFor="f-title" optional error={err("title")}><Input {...common("title")} /></Field>
          <Field label="Description" htmlFor="f-description" optional error={err("description")}><Textarea {...common("description")} rows={2} /></Field>
        </>
      )}

      {type === "file" && (
        <>
          <Field label="Filename" htmlFor="f-filename" error={err("filename")}><Input {...common("filename")} placeholder="report.pdf" autoFocus /></Field>
          <Field label="File or document URL" htmlFor="f-url" optional error={err("url")} hint="Link to where the file lives (Drive, Dropbox, your site…). Files themselves are not uploaded or stored here."><Input {...common("url", "hint")} type="url" inputMode="url" /></Field>
          <div>
            <label htmlFor="f-pick" className="mb-1.5 block text-sm font-medium">Fill from a local file <span className="text-xs font-normal text-muted">Optional</span></label>
            <input id="f-pick" type="file" onChange={(e) => pickFile(e.target.files?.[0])} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent-strong`} />
            <p className="mt-1.5 font-body text-sm text-muted">Only the name, type and size are read. The file stays on this device.</p>
          </div>
          <Field label="Description" htmlFor="f-description" optional error={err("description")}><Textarea {...common("description")} rows={2} /></Field>
        </>
      )}

      <Field label="Tags" htmlFor="f-tags" optional hint="Press Enter or comma to add.">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-card p-2 focus-within:border-accent">
          {tags.map((t) => <TagBadge key={t} tag={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />)}
          <input
            id="f-tags"
            list="known-tags"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={() => commitTags(tagDraft)}
            aria-describedby="f-tags-hint"
            className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-[15px] outline-none placeholder:text-muted/80"
            placeholder={tags.length ? "" : "design, reading…"}
          />
          <datalist id="known-tags">{knownTags.filter((t) => !tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        {errors.tags && <p role="alert" className="mt-1.5 text-sm text-danger">⚠ {errors.tags}</p>}
      </Field>

      <Field label="Collection" htmlFor="f-collection" optional error={err("collectionId")}>
        <Select id="f-collection" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
          <option value="">No collection</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>

      {formError && <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">⚠ {formError}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {saving ? "Saving…" : editing ? "Save changes" : "Save"}
        </Button>
      </div>
    </form>
  );
}
