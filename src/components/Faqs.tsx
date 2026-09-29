import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CURRENCY } from '../format';
import { MAX_STAY_NIGHTS } from '../stay';

const inlineLink =
  'text-brass-ink underline decoration-brass/40 underline-offset-2 transition-colors duration-[120ms] hover:text-ink hover:decoration-ink';

// Every answer describes what the site and API actually do today — nothing
// here promises a policy the code does not keep.
const FAQS: { question: string; answer: ReactNode }[] = [
  {
    question: 'Do I need an account to see what is free?',
    answer: (
      <>
        No. Pick your dates and number of guests and every room shows how many are left. You only need an account
        when you book, so the stay is kept under your name.{' '}
        <Link to="/signup" className={inlineLink}>
          Create one
        </Link>{' '}
        in under a minute.
      </>
    ),
  },
  {
    question: 'My booking says “pending”. Is the room mine?',
    answer:
      'Yes. A pending booking holds the room exactly as a confirmed one does, so nobody else can take it for those nights. Pending only means payment has not been taken yet.',
  },
  {
    question: 'Can I cancel a booking?',
    answer: (
      <>
        Yes, any time up to the day you check in. Open{' '}
        <Link to="/bookings" className={inlineLink}>
          My bookings
        </Link>{' '}
        and choose Cancel; the room is released straight away. Once a stay has started it can no longer be cancelled
        online.
      </>
    ),
  },
  {
    question: 'How long can I stay?',
    answer: `Anything from one night up to ${MAX_STAY_NIGHTS}. For a longer stay, make a second booking that starts on the day the first one ends.`,
  },
  {
    question: 'How many guests can share a room?',
    answer: (
      <>
        Every room shows how many it sleeps, and a search only shows rooms that fit your whole party.{' '}
        <Link to="/categories" className={inlineLink}>
          Compare the categories
        </Link>{' '}
        to see them side by side.
      </>
    ),
  },
  {
    question: 'How is the price worked out?',
    answer: `Rooms are priced per night in ${CURRENCY}. The total is simply the nightly rate times the number of nights, and it is shown before you book.`,
  },
  {
    question: 'The room was free, then my booking failed. Why?',
    answer:
      'Someone booked the last room for those nights a moment before you did. Nothing was reserved or charged; try different dates or another room.',
  },
  {
    question: 'I forgot my password.',
    answer: (
      <>
        Use{' '}
        <Link to="/forgot-password" className={inlineLink}>
          Forgot password
        </Link>{' '}
        and we will email you a link to set a new one.
      </>
    ),
  },
];

// Frequently asked questions as an accordion: one answer open at a time, each
// question a real button so it works from the keyboard and reads correctly
// to a screen reader. The panel animates its height with the grid-rows trick.
export function Faqs() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="grid grid-cols-1 gap-10 pt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:pt-28"
    >
      <div className="lg:sticky lg:top-32 lg:self-start">
        <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">FAQs</p>
        <h2
          id={`${baseId}-title`}
          className="mb-4 max-w-[14ch] font-serif text-[40px] leading-[1.02] font-normal text-balance text-ink sm:text-[52px]"
        >
          Questions, answered.
        </h2>
        <p className="max-w-[38ch] text-[15px] leading-relaxed text-graphite">
          The things guests most often ask before they book, from holding a room to cancelling one.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {FAQS.map((faq, index) => {
          const isOpen = open === index;
          const buttonId = `${baseId}-q${index}`;
          const panelId = `${baseId}-a${index}`;

          return (
            <li
              key={faq.question}
              className={`rounded-[22px] border transition-colors duration-200 ${
                isOpen ? 'border-paper-edge bg-paper' : 'border-paper-edge/70 bg-transparent hover:bg-paper/60'
              }`}
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-[22px] border-0 bg-transparent px-5 py-5 text-left text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:px-7"
                >
                  <span className="flex-1 font-serif text-[21px] leading-snug sm:text-[24px]">{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
                      isOpen ? 'bg-ink-deep text-cream' : 'border border-paper-edge text-ink'
                    }`}
                  >
                    {/* A plus whose upright folds away into a minus. */}
                    <span className="absolute h-[1.5px] w-3.5 rounded-full bg-current" />
                    <span
                      className={`absolute h-3.5 w-[1.5px] rounded-full bg-current transition-transform duration-300 ${
                        isOpen ? 'scale-y-0' : 'scale-y-100'
                      }`}
                    />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[60ch] px-5 pb-6 text-[15px] leading-relaxed text-graphite sm:px-7">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
