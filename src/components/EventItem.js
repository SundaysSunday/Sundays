import EventbriteEmbed from '../components/EventbriteEmbed';

export default function EventItem({ date, title, eventId }) {

    return(
        <div className="event-item-container">
            <div className="event-date">{date}</div>
            
            <div className="event-title">{title}</div>
            
            <EventbriteEmbed eventId={eventId} />
        </div>
    );
}
