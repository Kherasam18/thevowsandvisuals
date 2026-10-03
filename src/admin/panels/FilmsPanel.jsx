import { useAdmin } from '../Admin';
import { Button, Field, Section, inputClass } from '../ui';
import { parseYouTubeId } from './StoriesPanel';

const MAX_HOME_FILMS = 4;

/**
 * The Films page: one card per YouTube link, with its own text.
 *
 * Up to four can be ticked onto the Home page. Once four are ticked the rest
 * are disabled rather than silently ignored, so the limit is visible before
 * it is hit instead of being reported at publish time.
 */
export default function FilmsPanel() {
  const { content, update } = useAdmin();
  const shownCount = content.films.filter((f) => f.showOnHome).length;

  const addFilm = () =>
    update((d) => {
      d.films.push({
        id: `film_${Date.now().toString(36)}`,
        youtubeId: '',
        kind: '',
        title: '',
        description: '',
        showOnHome: false,
      });
    });

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Films"
        description="Each link becomes a card on the Films page. Cards alternate left and right automatically."
        actions={<Button variant="primary" onClick={addFilm}>Add a film</Button>}
      >
        <p className="text-sm text-neutral-600">
          <strong className="font-medium">{shownCount} of {MAX_HOME_FILMS}</strong> films are set to
          appear on the Home page.
        </p>
      </Section>

      {content.films.map((film, i) => {
        const id = parseYouTubeId(film.youtubeId);
        const invalid = film.youtubeId.trim() !== '' && !id;
        const atLimit = !film.showOnHome && shownCount >= MAX_HOME_FILMS;

        return (
          <Section
            key={film.id}
            title={film.title || 'Untitled film'}
            description={film.kind || undefined}
            actions={
              <>
                <Button
                  disabled={i === 0}
                  onClick={() => update((d) => { const l = d.films; [l[i - 1], l[i]] = [l[i], l[i - 1]]; })}
                >
                  ↑
                </Button>
                <Button
                  disabled={i === content.films.length - 1}
                  onClick={() => update((d) => { const l = d.films; [l[i + 1], l[i]] = [l[i], l[i + 1]]; })}
                >
                  ↓
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Remove "${film.title || 'this film'}" from the Films page?`)) {
                      update((d) => { d.films.splice(i, 1); });
                    }
                  }}
                >
                  Remove
                </Button>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
              <div className="flex flex-col gap-4">
                <Field
                  label="YouTube link"
                  hint="Paste the link from YouTube's address bar or Share button."
                  error={invalid ? 'That does not look like a YouTube link.' : null}
                >
                  <input
                    className={inputClass}
                    value={film.youtubeId}
                    placeholder="https://www.youtube.com/watch?v=…"
                    onChange={(e) => update((d) => { d.films[i].youtubeId = e.target.value; })}
                    onBlur={(e) => {
                      const parsed = parseYouTubeId(e.target.value);
                      if (parsed) update((d) => { d.films[i].youtubeId = parsed; });
                    }}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Type" hint="e.g. Wedding Teaser">
                    <input
                      className={inputClass}
                      value={film.kind}
                      onChange={(e) => update((d) => { d.films[i].kind = e.target.value; })}
                    />
                  </Field>
                  <Field label="Title" hint="Usually the couple's names">
                    <input
                      className={inputClass}
                      value={film.title}
                      onChange={(e) => update((d) => { d.films[i].title = e.target.value; })}
                    />
                  </Field>
                </div>

                <Field label="Description" hint="Each new line becomes its own line on the page.">
                  <textarea
                    rows={5}
                    className={inputClass}
                    value={film.description}
                    onChange={(e) => update((d) => { d.films[i].description = e.target.value; })}
                  />
                </Field>

                <label
                  className={`flex items-center gap-2.5 text-sm ${atLimit ? 'text-neutral-400' : 'text-neutral-800'}`}
                >
                  <input
                    type="checkbox"
                    checked={film.showOnHome}
                    disabled={atLimit}
                    onChange={(e) => update((d) => { d.films[i].showOnHome = e.target.checked; })}
                    className="h-4 w-4"
                  />
                  Show this film on the Home page
                  {atLimit && <span className="text-xs">(four already chosen)</span>}
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
          </Section>
        );
      })}

      {content.films.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">No films yet.</p>
      )}
    </div>
  );
}
