import { useAdmin } from '../Admin';
import { Button, Field, ImageSlot, Section, inputClass } from '../ui';
import { parseYouTubeId } from './StoriesPanel';

/** Add / move / remove controls shared by every repeating block below. */
function RowTools({ index, length, onMove, onRemove, label }) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="flex gap-1">
        <Button disabled={index === 0} onClick={() => onMove(index, index - 1)}>
          ↑
        </Button>
        <Button disabled={index === length - 1} onClick={() => onMove(index, index + 1)}>
          ↓
        </Button>
      </div>
      <Button
        variant="danger"
        onClick={() => {
          if (window.confirm(`Remove ${label}?`)) onRemove(index);
        }}
      >
        Remove
      </Button>
    </div>
  );
}

export default function AboutPanel() {
  const { content, library, update, uploadFiles } = useAdmin();
  const { about } = content;
  const shared = { library, onUpload: uploadFiles };

  /** Edit one list on the About page. */
  const listOps = (key) => ({
    move: (from, to) =>
      update((d) => {
        const l = d.about[key];
        if (to < 0 || to >= l.length) return;
        [l[from], l[to]] = [l[to], l[from]];
      }),
    remove: (i) => update((d) => { d.about[key].splice(i, 1); }),
    add: (item) =>
      update((d) => {
        d.about[key].push({ id: `${key}_${Date.now().toString(36)}`, ...item });
      }),
    set: (i, patch) => update((d) => { Object.assign(d.about[key][i], patch); }),
  });

  const people = listOps('people');
  const shoots = listOps('shoots');
  const places = listOps('places');
  const faqs = listOps('faqs');

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-900">
        <strong className="font-medium">This page starts with placeholder content.</strong> The
        three people are invented, and the answers below use typical industry figures — delivery
        times, photo counts and what is included. Check every number against how you actually work
        before publishing: an answer here reads as a promise to a customer.
      </div>

      <Section title="Banner" description="The wide photo at the top, and the single line beneath it.">
        <div className="grid gap-5 md:grid-cols-2">
          <ImageSlot
            label="Banner photo"
            hint="A wide, letterbox photo — shown as a shallow strip."
            media={content.media[about.heroId]}
            minWidth={1920}
            aspect="h-14"
            onChange={(id) => update((d) => { d.about.heroId = id; })}
            {...shared}
          />
          <Field label="One line" hint="One sentence. It is the first thing read on the page.">
            <textarea
              rows={3}
              className={inputClass}
              value={about.heroLine}
              onChange={(e) => update((d) => { d.about.heroLine = e.target.value; })}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="The people"
        description="Portraits and one line each. Couples hire people, so this is the part they read most closely."
        actions={
          <Button
            variant="primary"
            onClick={() => people.add({ name: '', line: '', mediaId: null })}
          >
            Add a person
          </Button>
        }
      >
        {about.people.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">Nobody added yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {about.people.map((person, i) => (
              <article key={person.id} className="rounded border border-neutral-200 p-4">
                <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
                  <ImageSlot
                    label="Portrait"
                    hint="Upright photo."
                    media={content.media[person.mediaId]}
                    minWidth={800}
                    aspect="h-28"
                    onChange={(id) => people.set(i, { mediaId: id })}
                    {...shared}
                  />
                  <div className="flex flex-col gap-3">
                    <Field label="First name">
                      <input
                        className={inputClass}
                        value={person.name}
                        onChange={(e) => people.set(i, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="One line about them">
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={person.line}
                        onChange={(e) => people.set(i, { line: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <RowTools
                  index={i}
                  length={about.people.length}
                  onMove={people.move}
                  onRemove={people.remove}
                  label={person.name || 'this person'}
                />
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="How we shoot"
        description="Short behind-the-scenes clips from YouTube, with a line under each."
        actions={
          <Button onClick={() => shoots.add({ youtubeId: '', line: '', vertical: true })}>
            Add a clip
          </Button>
        }
      >
        {about.shoots.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">No clips yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {about.shoots.map((shoot, i) => {
              const id = parseYouTubeId(shoot.youtubeId);
              const invalid = shoot.youtubeId.trim() !== '' && !id;

              return (
                <article key={shoot.id} className="rounded border border-neutral-200 p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
                    <div className="flex flex-col gap-3">
                      <Field
                        label="YouTube link"
                        hint="A Short or an ordinary video both work."
                        error={invalid ? 'That does not look like a YouTube link.' : null}
                      >
                        <input
                          className={inputClass}
                          value={shoot.youtubeId}
                          placeholder="https://www.youtube.com/shorts/…"
                          onChange={(e) => shoots.set(i, { youtubeId: e.target.value })}
                          onBlur={(e) => {
                            const parsed = parseYouTubeId(e.target.value);
                            if (parsed) shoots.set(i, { youtubeId: parsed });
                          }}
                        />
                      </Field>
                      <Field label="Line underneath">
                        <input
                          className={inputClass}
                          value={shoot.line}
                          onChange={(e) => shoots.set(i, { line: e.target.value })}
                        />
                      </Field>
                      <label className="flex items-center gap-2.5 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={shoot.vertical}
                          onChange={(e) => shoots.set(i, { vertical: e.target.checked })}
                          className="h-4 w-4"
                        />
                        Upright reel
                        <span className="text-xs text-neutral-500">
                          (untick for an ordinary widescreen video)
                        </span>
                      </label>
                    </div>
                    <div>
                      <span className="mb-1 block text-sm font-medium text-neutral-700">Preview</span>
                      {id ? (
                        <img
                          src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className="w-full rounded border border-neutral-200 bg-neutral-100"
                        />
                      ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded border border-dashed border-neutral-300 text-xs text-neutral-400">
                          add a link
                        </div>
                      )}
                    </div>
                  </div>
                  <RowTools
                    index={i}
                    length={about.shoots.length}
                    onMove={shoots.move}
                    onRemove={shoots.remove}
                    label="this clip"
                  />
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Where we shoot"
        description="On a wide screen the photo changes as you run down the list; on a phone each one is its own picture."
        actions={
          <Button onClick={() => places.add({ name: '', note: '', mediaId: null })}>
            Add a place
          </Button>
        }
      >
        {about.places.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">No places yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {about.places.map((place, i) => (
              <article key={place.id} className="rounded border border-neutral-200 p-4">
                <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
                  <ImageSlot
                    label="Photo"
                    media={content.media[place.mediaId]}
                    minWidth={1200}
                    aspect="h-24"
                    onChange={(id) => places.set(i, { mediaId: id })}
                    {...shared}
                  />
                  <div className="flex flex-col gap-3">
                    <Field label="Place">
                      <input
                        className={inputClass}
                        value={place.name}
                        onChange={(e) => places.set(i, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="Note" hint="A short line — cities, or what weddings there are like.">
                      <input
                        className={inputClass}
                        value={place.note}
                        onChange={(e) => places.set(i, { note: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <RowTools
                  index={i}
                  length={about.places.length}
                  onMove={places.move}
                  onRemove={places.remove}
                  label={place.name || 'this place'}
                />
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Common questions"
        description="These are also published as structured data, so search engines and AI assistants can quote them."
        actions={
          <Button variant="primary" onClick={() => faqs.add({ question: '', answer: '' })}>
            Add a question
          </Button>
        }
      >
        <div className="mb-4 rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Two things make an answer quotable: put the answer in the first sentence, and write it so
          it stands alone. An answer that opens with &ldquo;it depends&rdquo; or refers to another
          question cannot be lifted.
        </div>

        {about.faqs.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">No questions yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {about.faqs.map((faq, i) => (
              <article key={faq.id} className="rounded border border-neutral-200 p-4">
                <div className="flex flex-col gap-3">
                  <Field label="Question" hint="Word it the way someone would actually ask it.">
                    <input
                      className={inputClass}
                      value={faq.question}
                      onChange={(e) => faqs.set(i, { question: e.target.value })}
                    />
                  </Field>
                  <Field label="Answer">
                    <textarea
                      rows={4}
                      className={inputClass}
                      value={faq.answer}
                      onChange={(e) => faqs.set(i, { answer: e.target.value })}
                    />
                  </Field>
                </div>
                <RowTools
                  index={i}
                  length={about.faqs.length}
                  onMove={faqs.move}
                  onRemove={faqs.remove}
                  label="this question"
                />
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
