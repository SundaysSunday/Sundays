import EventbriteEmbed from '../components/EventbriteEmbed';

export default function EventItem({ date, title, eventId }) {

    return(
        <div className="event-item-container">
            <p className="event-date">{date}</p>
            
            <p className="event-title">{title}</p>
            <div className="event-button-container">
                <EventbriteEmbed eventId={eventId} />

                <button className="purchase-button"><a rel="noopener noreferrer" target="_blank" href="https://widgets.resy.com/#/venues/5911?ref=https%3A%2F%2Ftowncitizen.ca%2F&src=towncitizen.ca-widget&innerHeight=631&innerWidth=393&searchSessionId=undefined&apiKey=4SfVxh2LuBKiv2rUo43gaJ9n10clXlAb&venueId=5911&referrerPath=%2F&date=2026-11-08&seats=2">Evening Reservations</a></button>        
            </div>
</div>
    );
}
