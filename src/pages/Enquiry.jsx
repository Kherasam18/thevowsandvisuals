import { useState } from 'react';
import { SOCIALS, CONTACT } from '../data/site';
import SiteImage from '../content/SiteImage';
import { useContent } from '../content/ContentProvider';

const COUNTRY_CODES = ['+91', '+971', '+66', '+62', '+44', '+1', '+61', '+65'];

const SERVICES = ['Wedding Photography & Videography', 'Pre-wedding Shoot'];

const EMPTY = {
  name: '',
  email: '',
  countryCode: '+91',
  phone: '',
  location: '',
  weddingDate: '',
  services: [],
  message: '',
  altEmail: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please enter the bride & groom name.';
  if (!values.email.trim()) errors.email = 'Please enter an email address.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!values.phone.trim()) errors.phone = 'Please enter a phone number.';
  if (!values.location.trim()) errors.location = 'Please enter the wedding location.';
  if (!values.weddingDate) errors.weddingDate = 'Please choose a wedding date.';
  if (!values.message.trim()) errors.message = 'Please tell us a little about your wedding.';
  if (values.altEmail.trim() && !EMAIL_RE.test(values.altEmail.trim()))
    errors.altEmail = 'Please enter a valid email address.';
  return errors;
}

// No width here — callers set it, so the phone country-code select can be
// narrow without `w-full` overriding it.
const FIELD =
  'border border-ink/25 bg-white/70 px-3 py-2.5 font-serif text-[15px] text-ink ' +
  'outline-none transition-colors duration-200 placeholder:text-ink/35 ' +
  'focus:border-ink/60';

const FIELD_FULL = `${FIELD} w-full`;

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-serif text-[14px] leading-[1.4] text-ink">
      {children}
      {required && <span className="ml-1 text-rose">*</span>}
    </label>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 font-serif text-[13px] leading-[1.4] text-maroon">
      {children}
    </p>
  );
}

export default function Enquiry() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // null | 'success'
  const content = useContent();
  const hero = content?.media[content.enquiry.heroId] ?? null;

  const set = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setStatus(null);
  };

  const toggleService = (service) => {
    setValues((v) => ({
      ...v,
      services: v.services.includes(service)
        ? v.services.filter((s) => s !== service)
        : [...v.services, service],
    }));
    setStatus(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setStatus(null);
      const first = document.getElementById(`field-${Object.keys(found)[0]}`);
      first?.focus();
      return;
    }

    // TODO: wire up to a real backend / form service. Frontend-only build —
    // nothing is persisted or sent anywhere.
    console.log('[Enquiry] submitted:', {
      ...values,
      phone: `${values.countryCode} ${values.phone}`,
    });

    setStatus('success');
    setValues(EMPTY);
  };

  return (
    <>
      {/* Hero banner */}
      <section className="w-full">
        <SiteImage
          media={hero}
          alt={hero?.alt || 'Couple photographed on a snow-covered mountain ridge'}
          loading="eager"
          sizes="100vw"
          className="h-[26vw] min-h-[220px] w-full object-cover"
        />
      </section>

      {/* Mission + contact details */}
      <section className="w-full bg-cream px-[6vw] pt-[4vw] text-center">
        <p className="font-serif text-eyebrow uppercase leading-[1.4] tracking-[0.06em] text-black">
          Our Mission
        </p>

        <h1 className="mx-auto mt-[1.2vw] max-w-[24ch] font-display text-h1 leading-[1.2] text-ink">
          Where Every Frame
          <br />
          Tells a Love Story That
          <br />
          Lasts Forever
        </h1>

        <p className="mt-[2.4vw] font-serif text-eyebrow capitalize leading-[1.5] text-ink">
          Please go through our FAQ section to find answers to some common questions.
        </p>

        <p className="mt-[1.2vw] font-serif text-eyebrow capitalize leading-[1.7] text-ink">
          <a href={`mailto:${CONTACT.email}`} className="hover:underline">
            {CONTACT.email}
          </a>
          <br />
          <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:underline">
            {CONTACT.phone}
          </a>
          <br />
          <span className="uppercase">{CONTACT.regions}</span>
        </p>

        <ul className="mt-[1.6vw] flex items-center justify-center gap-[1.2vw]">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="block transition-opacity duration-200 hover:opacity-60"
              >
                <img src={s.icon} alt="" aria-hidden="true" className="h-[18px] w-auto" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Enquiry form */}
      <section className="w-full bg-cream px-[6vw] pb-[6vw] pt-[3.5vw]">
        {/* Source form occupies ~43% of the viewport at desktop. */}
        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label="Contact us"
          className="mx-auto w-full max-w-[700px] md:w-[44%]"
        >
          <div className="flex flex-col gap-[1.35rem]">
            <div>
              <Label htmlFor="field-name" required>
                Bride &amp; Groom Name (required)
              </Label>
              <input
                id="field-name"
                type="text"
                placeholder="First name"
                value={values.name}
                onChange={set('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'err-name' : undefined}
                className={FIELD_FULL}
              />
              <FieldError id="err-name">{errors.name}</FieldError>
            </div>

            <div>
              <Label htmlFor="field-email" required>
                Email (required)
              </Label>
              <input
                id="field-email"
                type="email"
                placeholder="Email"
                value={values.email}
                onChange={set('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'err-email' : undefined}
                className={FIELD_FULL}
              />
              <FieldError id="err-email">{errors.email}</FieldError>
            </div>

            <div>
              <Label htmlFor="field-phone" required>
                Phone (required)
              </Label>
              <div className="flex">
                <select
                  aria-label="Select a country code"
                  value={values.countryCode}
                  onChange={set('countryCode')}
                  className={`${FIELD} w-[104px] shrink-0 border-r-0 pr-1`}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  id="field-phone"
                  type="tel"
                  placeholder="Phone"
                  value={values.phone}
                  onChange={set('phone')}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'err-phone' : undefined}
                  className={`${FIELD} min-w-0 flex-1`}
                />
              </div>
              <FieldError id="err-phone">{errors.phone}</FieldError>
            </div>

            <div>
              <Label htmlFor="field-location" required>
                Location of the wedding (required)
              </Label>
              <input
                id="field-location"
                type="text"
                value={values.location}
                onChange={set('location')}
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? 'err-location' : undefined}
                className={FIELD_FULL}
              />
              <FieldError id="err-location">{errors.location}</FieldError>
            </div>

            <div>
              <Label htmlFor="field-weddingDate" required>
                Wedding Date (required)
              </Label>
              <input
                id="field-weddingDate"
                type="date"
                value={values.weddingDate}
                onChange={set('weddingDate')}
                aria-invalid={!!errors.weddingDate}
                aria-describedby={errors.weddingDate ? 'err-weddingDate' : undefined}
                className={FIELD_FULL}
              />
              <FieldError id="err-weddingDate">{errors.weddingDate}</FieldError>
            </div>

            <fieldset>
              <legend className="mb-1.5 font-serif text-[14px] leading-[1.4] text-ink">
                Services Required
              </legend>
              <div className="flex flex-col gap-2">
                {SERVICES.map((service) => (
                  <label
                    key={service}
                    className="flex cursor-pointer items-center gap-2.5 font-serif text-[15px] text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={values.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="h-[15px] w-[15px] accent-maroon"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="field-message" required>
                Tell us more about your wedding - event flow, venues.
              </Label>
              <textarea
                id="field-message"
                rows={4}
                placeholder="Message"
                value={values.message}
                onChange={set('message')}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'err-message' : undefined}
                className={`${FIELD_FULL} resize-y`}
              />
              <FieldError id="err-message">{errors.message}</FieldError>
            </div>

            {/* Second, optional email field — present in the source form. */}
            <div>
              <Label htmlFor="field-altEmail">Email</Label>
              <input
                id="field-altEmail"
                type="email"
                value={values.altEmail}
                onChange={set('altEmail')}
                aria-invalid={!!errors.altEmail}
                aria-describedby={errors.altEmail ? 'err-altEmail' : undefined}
                className={FIELD_FULL}
              />
              <FieldError id="err-altEmail">{errors.altEmail}</FieldError>
            </div>
          </div>

          <button
            type="submit"
            className="mt-[1.6rem] w-[48%] min-w-[160px] bg-black py-2.5 font-serif text-[15px] text-white transition-opacity duration-200 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          >
            Submit
          </button>

          <p aria-live="polite" className="mt-3 min-h-[1.4em] font-serif text-[14px] text-maroon">
            {status === 'success' && 'Thank you — your enquiry has been received. We’ll be in touch shortly.'}
          </p>
        </form>
      </section>
    </>
  );
}
