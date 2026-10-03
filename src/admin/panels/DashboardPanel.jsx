import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../Admin';
import { Button, Section } from '../ui';

const when = (iso) => {
  if (!iso) return 'never';
  const date = new Date(iso);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/** What is on the site, what has changed since, and how to undo. */
export default function DashboardPanel() {
  const { content, meta, restoreVersion, listVersions } = useAdmin();
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    listVersions().then(setVersions).catch(() => setVersions([]));
  }, [listVersions, meta?.publishedVersion]);

  const counts = [
    { label: 'Photos', value: Object.keys(content.media).length, to: '/admin/library' },
    { label: 'Stories', value: content.stories.length, to: '/admin/stories' },
    { label: 'Films', value: content.films.length, to: '/admin/films' },
    { label: 'On the Galleries page', value: content.galleries.selectedIds.length, to: '/admin/galleries' },
  ];

  const onRestore = async (version) => {
    if (!window.confirm(`Bring back the content from version ${version.version}? Nothing goes live until you press Publish.`)) return;
    await restoreVersion(version.key);
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="The site right now">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="rounded border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50"
            >
              <dt className="text-xs text-neutral-500">{c.label}</dt>
              <dd className="text-2xl font-semibold">{c.value}</dd>
            </Link>
          ))}
        </dl>

        <p className="mt-4 text-sm text-neutral-600">
          Live version <strong>{meta?.publishedVersion ?? '—'}</strong>, published {when(meta?.publishedUpdatedAt)}.
          {meta?.hasUnpublishedChanges ? (
            <span className="text-amber-700"> There are changes that are not live yet — press Publish.</span>
          ) : (
            <span className="text-neutral-400"> The site matches your edits.</span>
          )}
        </p>
      </Section>

      <Section
        title="How this works"
        description="Three things worth knowing before you start."
      >
        <ul className="flex list-inside list-disc flex-col gap-1.5 text-sm text-neutral-600">
          <li>Your changes save as you make them, but visitors see nothing until you press <strong>Publish</strong>.</li>
          <li>Photos you upload are kept at full quality. The site automatically serves smaller copies so pages load quickly, and the full-size photo is used when someone opens it.</li>
          <li>Deleting a photo is only possible once nothing on the site points at it.</li>
        </ul>
      </Section>

      <Section title="Earlier versions" description="Every publish is kept, so you can go back.">
        {versions.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing yet — this is the first version.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {versions.map((v) => (
              <li key={v.key} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  Version <strong>{v.version}</strong>
                  <span className="ml-2 text-neutral-500">{when(v.updatedAt)}</span>
                </span>
                <Button onClick={() => onRestore(v)}>Bring this back</Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
