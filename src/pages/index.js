import EventItem from '../components/EventItem';
export default function Home() {
  return (
    <>
      <img
        class="branding-image"
        src="https://github.com/SundaysSunday/Sundays/blob/main/images/Girl_Transparent.png?raw=true"
        alt="Branding illustration"
      />

      {/*<p class="coming-soon-message">
        Working on some fun stuff, <br />
        Check back soon!
        <br />
        <span class="signature">- Veronica &amp; Nick</span>
      </p>*/}
      <div class="event-item-list"> 
        <EventItem date="Nov 8th" title="Sundays at Citizen" eventId="2003304799583"></EventItem>
      </div>

    </>
  );
}
