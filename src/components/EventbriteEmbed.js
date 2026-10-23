import { useEffect } from 'react';

export default function EventbriteEmbed({ eventId }) {
  useEffect(() => {
    if (!eventId) return;

    const triggerId = `eventbrite-widget-modal-trigger-${eventId}`;
    let cancelled = false;

    const initializeWidget = () => {
      if (cancelled || !window.EBWidgets) return;

      window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: String(eventId),
        modal: true,
        modalTriggerElementId: triggerId,
        onOrderComplete: () => {
          console.log('Order complete!');
        },
      });
    };

    // Reuse the script if it is already loaded.
    if (window.EBWidgets) {
      initializeWidget();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector(
      'script[src="https://www.eventbrite.ca/static/widgets/eb_widgets.js"]'
    );

    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://www.eventbrite.ca/static/widgets/eb_widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener('load', initializeWidget);

    return () => {
      cancelled = true;
      script.removeEventListener('load', initializeWidget);
    };
  }, [eventId]);

  return (
    <>
      <noscript>
        <a
          href={`https://www.eventbrite.ca/e/sundays-at-citizen-tickets-${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Tickets
        </a>
      </noscript>

      <button
        className="eventbrite-button"
        id={`eventbrite-widget-modal-trigger-${eventId}`}
      >
        Buy Tickets
      </button>
    </>
  );
}