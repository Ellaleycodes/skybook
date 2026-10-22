# ✈️ SkyBook

A simple flight booking app built with plain HTML, CSS and JavaScript. Search for flights between Nigerian airports, pick one, enter passenger details and get a booking reference. No frameworks and no backend.

> Practice project. Flights are generated mock data and no real bookings or payments happen.

## Features

- Search by origin, destination, date, number of passengers and class
- Mock flight results with airline, times, duration, price and seats left
- Passenger details form that adapts to the number of passengers
- Booking confirmation with a generated reference number
- "My Bookings" history saved in the browser (localStorage)
- Navy and gray airline-style design with an airplane backdrop
- Responsive layout for phones and desktops

## Project structure

```
skybook/
├── index.html    # Page structure and screens
├── styles.css    # Styling and theme
├── script.js     # Mock data, search, booking logic
└── README.md
```

## Run it locally

1. Download all files into the same folder
2. Open `index.html` in your browser

## Roadmap

- [ ] Seat selection
- [ ] Round-trip flights
- [ ] Filter and sort results (price, duration, airline)
- [ ] Cancel a booking
- [ ] Price changes by class
- [ ] Backend and database

## Tech

HTML5, CSS3, vanilla JavaScript, localStorage
