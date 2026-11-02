import Contact from '@/components/Contact';
import EventItem from '../components/EventItem';

export default function Home() {
  return (
    <>
    <div className="landing">
      <img
        className="branding-image"
        src="https://github.com/SundaysSunday/Sundays/blob/main/images/Girl_Transparent.png?raw=true"
        alt="Branding illustration"
      />

      
    <h3>Events</h3>

      <div className="event-item-list">
        <EventItem date="Nov 8th" title="Sundays at Citizen" eventId="2003304799583"></EventItem>
      </div>
      </div>

    <Contact />
    </>
  );
}
