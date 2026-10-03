import { useAdmin } from '../Admin';
import { ImageList, ImageSlot, Section } from '../ui';

/** The two smaller slots: the Enquire banner and the footer strip. */
export default function PagesPanel() {
  const { content, library, update, uploadFiles } = useAdmin();
  const shared = { library, onUpload: uploadFiles };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Enquire page" description="The wide banner across the top of the enquiry form.">
        <ImageSlot
          label="Banner"
          hint="A wide, letterbox photo — it is shown as a shallow strip."
          media={content.media[content.enquiry.heroId]}
          minWidth={1920}
          aspect="h-14"
          onChange={(id) => update((d) => { d.enquiry.heroId = id; })}
          {...shared}
        />
      </Section>

      <Section
        title="Footer"
        description="The strip of photos above the Instagram handle, on every page."
      >
        <ImageList
          label="Footer photos"
          hint="Four photos. Phones show the first three; the fourth appears on wider screens."
          ids={content.footer.thumbIds}
          media={content.media}
          max={4}
          minWidth={600}
          onChange={(ids) => update((d) => { d.footer.thumbIds = ids; })}
          {...shared}
        />
      </Section>
    </div>
  );
}
