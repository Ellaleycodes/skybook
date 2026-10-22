// ===== MOCK DATA =====
const airports = [
    { code: 'LOS', name: 'Lagos (Murtala Muhammed)' },
    { code: 'ABV', name: 'Abuja (Nnamdi Azikiwe)' },
    { code: 'QUO', name: 'Akwa Ibom (Ibom Airport)' },
    { code: 'PHC', name: 'Port Harcourt' },
    { code: 'KAN', name: 'Kano (Mallam Aminu Kano)' },
    { code: 'ENU', name: 'Enugu (Akanu Ibiam)' },
    { code: 'CBQ', name: 'Calabar Airport' },
    { code: 'IBA', name: 'Ibadan Airport' }
];

const airlines = [
    { name: 'Air Peace', logo: '🟢' },
    { name: 'Arik Air', logo: '🔵' },
    { name: 'Ibom Air', logo: '🟡' },
    { name: 'Dana Air', logo: '🔴' },
    { name: 'United Nigeria', logo: '🟣' }
];

// Deterministic-ish mock flight generator based on route + date
function generateFlights(origin, destination, date) {
    if (origin === destination) return [];

    const seed = (origin + destination + date).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const numFlights = 3 + (seed % 4); // 3-6 flights
    const flights = [];

    for (let i = 0; i < numFlights; i++) {
        const airline = airlines[(seed + i * 7) % airlines.length];
        const depHour = (6 + i * 3 + (seed % 3)) % 24;
        const depMin = (seed * (i + 1)) % 60;
        const durationMins = 60 + ((seed + i) % 90); // 1hr - 2.5hr flights
        const basePrice = 35000 + ((seed + i * 13) % 12) * 5000;
        const seatsLeft = 1 + ((seed + i * 5) % 25);

        const depDate = new Date(`${date}T${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}:00`);
        const arrDate = new Date(depDate.getTime() + durationMins * 60000);

        flights.push({
            id: `${origin}${destination}${date}${i}`,
            airline: airline.name,
            logo: airline.logo,
            flightNumber: `${airline.name.substring(0, 2).toUpperCase()}${100 + ((seed + i * 3) % 800)}`,
            origin,
            destination,
            departTime: depDate,
            arriveTime: arrDate,
            durationMins,
            price: basePrice,
            seatsLeft
        });
    }

    return flights.sort((a, b) => a.departTime - b.departTime);
}

// ===== STATE =====
let selectedFlight = null;
let searchParams = {};
let bookings = JSON.parse(localStorage.getItem('skybook_bookings')) || [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    populateAirportDropdowns();
    setMinDate();
    setupEventListeners();
});

function populateAirportDropdowns() {
    const origin = document.getElementById('origin');
    const destination = document.getElementById('destination');

    airports.forEach(airport => {
        const optionText = `${airport.code} — ${airport.name}`;
        origin.innerHTML += `<option value="${airport.code}">${optionText}</option>`;
        destination.innerHTML += `<option value="${airport.code}">${optionText}</option>`;
    });

    // Default: different origin/destination
    origin.value = 'LOS';
    destination.value = 'QUO';
}

function setMinDate() {
    const dateInput = document.getElementById('departDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
}

function setupEventListeners() {
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('swapBtn').addEventListener('click', swapAirports);
    document.getElementById('backToSearch').addEventListener('click', () => showScreen('searchScreen'));
    document.getElementById('backToResults').addEventListener('click', () => showScreen('resultsScreen'));
    document.getElementById('passengerForm').addEventListener('submit', handleBookingSubmit);
    document.getElementById('newBookingBtn').addEventListener('click', () => showScreen('searchScreen'));
    document.getElementById('viewBookingsBtn').addEventListener('click', renderBookings);
    document.getElementById('backToSearchFromBookings').addEventListener('click', () => showScreen('searchScreen'));
}

function swapAirports() {
    const origin = document.getElementById('origin');
    const destination = document.getElementById('destination');
    const temp = origin.value;
    origin.value = destination.value;
    destination.value = temp;
}

// ===== SEARCH =====
function handleSearch(e) {
    e.preventDefault();

    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('departDate').value;
    const passengers = parseInt(document.getElementById('passengers').value);
    const travelClass = document.getElementById('travelClass').value;

    if (origin === destination) {
        alert('Origin and destination cannot be the same. Please choose different airports.');
        return;
    }

    searchParams = { origin, destination, date, passengers, travelClass };
    const flights = generateFlights(origin, destination, date);

    renderResults(flights);
    showScreen('resultsScreen');
}

function renderResults(flights) {
    const container = document.getElementById('flightResults');
    const summary = document.getElementById('resultsSummary');

    summary.textContent = `${searchParams.origin} → ${searchParams.destination} · ${formatDateReadable(searchParams.date)} · ${searchParams.passengers} passenger(s) · ${searchParams.travelClass}`;

    if (flights.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <p>No flights found for this route. Try a different date or destination.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = flights.map(flight => `
        <div class="flight-card" onclick="selectFlight('${flight.id}')">
            <div class="flight-airline">
                <span class="airline-logo">${flight.logo}</span>
                <div>
                    <div class="airline-name">${flight.airline}</div>
                    <div class="flight-number">${flight.flightNumber}</div>
                </div>
            </div>

            <div class="flight-route">
                <div class="route-point">
                    <div class="route-time">${formatTime(flight.departTime)}</div>
                    <div class="route-code">${flight.origin}</div>
                </div>
                <div class="route-line">
                    ${formatDuration(flight.durationMins)}
                    <div class="route-line-bar"></div>
                    Direct
                </div>
                <div class="route-point">
                    <div class="route-time">${formatTime(flight.arriveTime)}</div>
                    <div class="route-code">${flight.destination}</div>
                </div>
            </div>

            <div class="flight-price-block">
                <div class="flight-class">${searchParams.travelClass}</div>
                <div class="flight-price">₦${flight.price.toLocaleString()}</div>
                ${flight.seatsLeft <= 5 ? `<div class="flight-seats">Only ${flight.seatsLeft} seats left</div>` : ''}
            </div>
        </div>
    `).join('');

    // Store flights for lookup on click
    window.currentFlights = flights;
}

function selectFlight(flightId) {
    selectedFlight = window.currentFlights.find(f => f.id === flightId);
    if (!selectedFlight) return;

    renderPassengerForm();
    renderFlightSummary();
    showScreen('detailsScreen');
}

// ===== PASSENGER DETAILS =====
function renderPassengerForm() {
    const container = document.getElementById('passengerFields');
    const count = searchParams.passengers;
    let html = '';

    for (let i = 1; i <= count; i++) {
        html += `
            <div class="passenger-block">
                <h4>Passenger ${i}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="pName${i}">Full Name</label>
                        <input type="text" id="pName${i}" required placeholder="e.g. Immanuella Udofia">
                    </div>
                    <div class="form-group">
                        <label for="pAge${i}">Age</label>
                        <input type="number" id="pAge${i}" min="0" max="120" required placeholder="e.g. 25">
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderFlightSummary() {
    const f = selectedFlight;
    const total = f.price * searchParams.passengers;

    document.getElementById('flightSummaryCard').innerHTML = `
        <h3>Flight Summary</h3>
        <div class="summary-row"><span>Airline</span><span>${f.logo} ${f.airline}</span></div>
        <div class="summary-row"><span>Flight No.</span><span>${f.flightNumber}</span></div>
        <div class="summary-row"><span>Route</span><span>${f.origin} → ${f.destination}</span></div>
        <div class="summary-row"><span>Departure</span><span>${formatTime(f.departTime)}</span></div>
        <div class="summary-row"><span>Arrival</span><span>${formatTime(f.arriveTime)}</span></div>
        <div class="summary-row"><span>Duration</span><span>${formatDuration(f.durationMins)}</span></div>
        <div class="summary-row"><span>Class</span><span>${searchParams.travelClass}</span></div>
        <div class="summary-row"><span>Passengers</span><span>${searchParams.passengers}</span></div>
        <div class="summary-row"><span>Price / person</span><span>₦${f.price.toLocaleString()}</span></div>
        <div class="summary-row summary-total"><span>Total</span><span>₦${total.toLocaleString()}</span></div>
    `;
}

function handleBookingSubmit(e) {
    e.preventDefault();

    const passengers = [];
    for (let i = 1; i <= searchParams.passengers; i++) {
        passengers.push({
            name: document.getElementById(`pName${i}`).value,
            age: document.getElementById(`pAge${i}`).value
        });
    }

    const booking = {
        ref: generateBookingRef(),
        flight: selectedFlight,
        searchParams: { ...searchParams },
        passengers,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        total: selectedFlight.price * searchParams.passengers,
        bookedAt: new Date().toISOString()
    };

    bookings.push(booking);
    localStorage.setItem('skybook_bookings', JSON.stringify(bookings));

    renderConfirmation(booking);
    showScreen('confirmationScreen');
}

function generateBookingRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = '';
    for (let i = 0; i < 6; i++) {
        ref += chars[Math.floor(Math.random() * chars.length)];
    }
    return ref;
}

// ===== CONFIRMATION =====
function renderConfirmation(booking) {
    document.getElementById('bookingRef').textContent = `Booking Reference: ${booking.ref}`;

    document.getElementById('confirmationDetails').innerHTML = `
        <div class="summary-row"><span>Passenger(s)</span><span>${booking.passengers.map(p => p.name).join(', ')}</span></div>
        <div class="summary-row"><span>Route</span><span>${booking.flight.origin} → ${booking.flight.destination}</span></div>
        <div class="summary-row"><span>Airline</span><span>${booking.flight.logo} ${booking.flight.airline} (${booking.flight.flightNumber})</span></div>
        <div class="summary-row"><span>Departure</span><span>${formatTime(booking.flight.departTime)}</span></div>
        <div class="summary-row"><span>Class</span><span>${booking.searchParams.travelClass}</span></div>
        <div class="summary-row summary-total"><span>Total Paid</span><span>₦${booking.total.toLocaleString()}</span></div>
    `;
}

// ===== MY BOOKINGS =====
function renderBookings() {
    const container = document.getElementById('bookingsList');

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🎫</div>
                <p>No bookings yet. Search for a flight to get started!</p>
            </div>
        `;
    } else {
        container.innerHTML = bookings.slice().reverse().map(b => `
            <div class="booking-item">
                <div>
                    <div class="booking-item-ref">${b.ref}</div>
                    <div class="booking-item-route">${b.flight.origin} → ${b.flight.destination}</div>
                    <div class="booking-item-ref">${formatDateReadable(b.searchParams.date)} · ${b.flight.airline}</div>
                </div>
                <div class="flight-price">₦${b.total.toLocaleString()}</div>
            </div>
        `).join('');
    }

    showScreen('bookingsScreen');
}

// ===== SCREEN NAVIGATION =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

// ===== FORMATTERS =====
function formatTime(date) {
    // Bookings reloaded from localStorage store dates as strings
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

function formatDateReadable(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
