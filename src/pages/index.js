import EventItem from '../components/EventItem';
import { AnimatedCountdown } from "../components/animated-countdown";

export default function Home() {
  return (
    <>
      <img
        className="branding-image"
        src="https://github.com/SundaysSunday/Sundays/blob/main/images/Girl_Transparent.png?raw=true"
        alt="Branding illustration"
      />

      {/*<p class="coming-soon-message">
        Working on some fun stuff, <br />
        Check back soon!
        <br />
        <span class="signature">- Veronica &amp; Nick</span>
      </p>
      <AnimatedCountdown targetDate={new Date(2026, 10, 8)}
      variant="modern"
      size="md" />*/}
    <h3>Events</h3>

      <div className="event-item-list"> 
        <EventItem date="Nov 8th" title="Sundays at Citizen" eventId="2003304799583"></EventItem>
      </div>

    </>
  );
}
