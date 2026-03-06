export interface CityEntry {
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  displayLabel: string;
}

function c(city: string, country: string, countryCode: string): CityEntry {
  return { city, country, countryCode, displayLabel: `${city}, ${country}` };
}

function cs(
  city: string,
  state: string,
  country: string,
  countryCode: string
): CityEntry {
  return {
    city,
    state,
    country,
    countryCode,
    displayLabel: `${city}, ${state}, ${country}`,
  };
}

export const MAJOR_CITIES: CityEntry[] = [
  // ─────────────────────────────────────────────
  // United States (80+ cities)
  // ─────────────────────────────────────────────
  cs("New York", "NY", "USA", "US"),
  cs("Los Angeles", "CA", "USA", "US"),
  cs("Chicago", "IL", "USA", "US"),
  cs("Houston", "TX", "USA", "US"),
  cs("Phoenix", "AZ", "USA", "US"),
  cs("Philadelphia", "PA", "USA", "US"),
  cs("San Antonio", "TX", "USA", "US"),
  cs("San Diego", "CA", "USA", "US"),
  cs("Dallas", "TX", "USA", "US"),
  cs("San Jose", "CA", "USA", "US"),
  cs("Austin", "TX", "USA", "US"),
  cs("Jacksonville", "FL", "USA", "US"),
  cs("Fort Worth", "TX", "USA", "US"),
  cs("Columbus", "OH", "USA", "US"),
  cs("Charlotte", "NC", "USA", "US"),
  cs("San Francisco", "CA", "USA", "US"),
  cs("Indianapolis", "IN", "USA", "US"),
  cs("Seattle", "WA", "USA", "US"),
  cs("Denver", "CO", "USA", "US"),
  cs("Washington", "DC", "USA", "US"),
  cs("Nashville", "TN", "USA", "US"),
  cs("Oklahoma City", "OK", "USA", "US"),
  cs("El Paso", "TX", "USA", "US"),
  cs("Boston", "MA", "USA", "US"),
  cs("Portland", "OR", "USA", "US"),
  cs("Las Vegas", "NV", "USA", "US"),
  cs("Memphis", "TN", "USA", "US"),
  cs("Louisville", "KY", "USA", "US"),
  cs("Baltimore", "MD", "USA", "US"),
  cs("Milwaukee", "WI", "USA", "US"),
  cs("Albuquerque", "NM", "USA", "US"),
  cs("Tucson", "AZ", "USA", "US"),
  cs("Fresno", "CA", "USA", "US"),
  cs("Sacramento", "CA", "USA", "US"),
  cs("Mesa", "AZ", "USA", "US"),
  cs("Kansas City", "MO", "USA", "US"),
  cs("Atlanta", "GA", "USA", "US"),
  cs("Omaha", "NE", "USA", "US"),
  cs("Colorado Springs", "CO", "USA", "US"),
  cs("Raleigh", "NC", "USA", "US"),
  cs("Long Beach", "CA", "USA", "US"),
  cs("Virginia Beach", "VA", "USA", "US"),
  cs("Miami", "FL", "USA", "US"),
  cs("Oakland", "CA", "USA", "US"),
  cs("Minneapolis", "MN", "USA", "US"),
  cs("Tampa", "FL", "USA", "US"),
  cs("Tulsa", "OK", "USA", "US"),
  cs("Arlington", "TX", "USA", "US"),
  cs("New Orleans", "LA", "USA", "US"),
  cs("Cleveland", "OH", "USA", "US"),
  cs("Honolulu", "HI", "USA", "US"),
  cs("Anchorage", "AK", "USA", "US"),
  cs("Pittsburgh", "PA", "USA", "US"),
  cs("Cincinnati", "OH", "USA", "US"),
  cs("Detroit", "MI", "USA", "US"),
  cs("Salt Lake City", "UT", "USA", "US"),
  cs("St. Louis", "MO", "USA", "US"),
  cs("Richmond", "VA", "USA", "US"),
  cs("Boise", "ID", "USA", "US"),
  cs("Des Moines", "IA", "USA", "US"),
  cs("Madison", "WI", "USA", "US"),
  cs("Hartford", "CT", "USA", "US"),
  cs("Trenton", "NJ", "USA", "US"),
  cs("Harrisburg", "PA", "USA", "US"),
  cs("Providence", "RI", "USA", "US"),
  cs("Montpelier", "VT", "USA", "US"),
  cs("Augusta", "ME", "USA", "US"),
  cs("Concord", "NH", "USA", "US"),
  cs("Frankfort", "KY", "USA", "US"),
  cs("Tallahassee", "FL", "USA", "US"),
  cs("Montgomery", "AL", "USA", "US"),
  cs("Jackson", "MS", "USA", "US"),
  cs("Little Rock", "AR", "USA", "US"),
  cs("Bismarck", "ND", "USA", "US"),
  cs("Pierre", "SD", "USA", "US"),
  cs("Helena", "MT", "USA", "US"),
  cs("Cheyenne", "WY", "USA", "US"),
  cs("Santa Fe", "NM", "USA", "US"),
  cs("Juneau", "AK", "USA", "US"),
  cs("Dover", "DE", "USA", "US"),
  cs("Annapolis", "MD", "USA", "US"),
  cs("Topeka", "KS", "USA", "US"),
  cs("Jefferson City", "MO", "USA", "US"),
  cs("Charleston", "WV", "USA", "US"),
  cs("Lansing", "MI", "USA", "US"),
  cs("Springfield", "IL", "USA", "US"),
  cs("St. Paul", "MN", "USA", "US"),
  cs("Olympia", "WA", "USA", "US"),
  cs("Salem", "OR", "USA", "US"),
  cs("Carson City", "NV", "USA", "US"),
  cs("Albany", "NY", "USA", "US"),
  cs("Columbia", "SC", "USA", "US"),

  // ─────────────────────────────────────────────
  // India (40+ cities)
  // ─────────────────────────────────────────────
  cs("Mumbai", "Maharashtra", "India", "IN"),
  cs("Delhi", "Delhi", "India", "IN"),
  cs("Bangalore", "Karnataka", "India", "IN"),
  cs("Hyderabad", "Telangana", "India", "IN"),
  cs("Ahmedabad", "Gujarat", "India", "IN"),
  cs("Chennai", "Tamil Nadu", "India", "IN"),
  cs("Kolkata", "West Bengal", "India", "IN"),
  cs("Pune", "Maharashtra", "India", "IN"),
  cs("Jaipur", "Rajasthan", "India", "IN"),
  cs("Lucknow", "Uttar Pradesh", "India", "IN"),
  cs("Kanpur", "Uttar Pradesh", "India", "IN"),
  cs("Nagpur", "Maharashtra", "India", "IN"),
  cs("Indore", "Madhya Pradesh", "India", "IN"),
  cs("Thane", "Maharashtra", "India", "IN"),
  cs("Bhopal", "Madhya Pradesh", "India", "IN"),
  cs("Visakhapatnam", "Andhra Pradesh", "India", "IN"),
  cs("Patna", "Bihar", "India", "IN"),
  cs("Vadodara", "Gujarat", "India", "IN"),
  cs("Ghaziabad", "Uttar Pradesh", "India", "IN"),
  cs("Ludhiana", "Punjab", "India", "IN"),
  cs("Agra", "Uttar Pradesh", "India", "IN"),
  cs("Nashik", "Maharashtra", "India", "IN"),
  cs("Ranchi", "Jharkhand", "India", "IN"),
  cs("Coimbatore", "Tamil Nadu", "India", "IN"),
  cs("Kochi", "Kerala", "India", "IN"),
  cs("Thiruvananthapuram", "Kerala", "India", "IN"),
  cs("Guwahati", "Assam", "India", "IN"),
  cs("Chandigarh", "Chandigarh", "India", "IN"),
  cs("Mysore", "Karnataka", "India", "IN"),
  cs("Noida", "Uttar Pradesh", "India", "IN"),
  cs("Gurugram", "Haryana", "India", "IN"),
  cs("Surat", "Gujarat", "India", "IN"),
  cs("Mangalore", "Karnataka", "India", "IN"),
  cs("Dehradun", "Uttarakhand", "India", "IN"),
  cs("Bhubaneswar", "Odisha", "India", "IN"),
  cs("Raipur", "Chhattisgarh", "India", "IN"),
  cs("Vijayawada", "Andhra Pradesh", "India", "IN"),
  cs("Madurai", "Tamil Nadu", "India", "IN"),
  cs("Jodhpur", "Rajasthan", "India", "IN"),
  cs("Amritsar", "Punjab", "India", "IN"),
  cs("Varanasi", "Uttar Pradesh", "India", "IN"),
  cs("Srinagar", "Jammu & Kashmir", "India", "IN"),
  cs("Aurangabad", "Maharashtra", "India", "IN"),
  cs("Shimla", "Himachal Pradesh", "India", "IN"),
  cs("Tiruchirappalli", "Tamil Nadu", "India", "IN"),

  // ─────────────────────────────────────────────
  // United Kingdom (20+ cities)
  // ─────────────────────────────────────────────
  c("London", "UK", "GB"),
  c("Manchester", "UK", "GB"),
  c("Birmingham", "UK", "GB"),
  c("Edinburgh", "UK", "GB"),
  c("Glasgow", "UK", "GB"),
  c("Bristol", "UK", "GB"),
  c("Leeds", "UK", "GB"),
  c("Liverpool", "UK", "GB"),
  c("Sheffield", "UK", "GB"),
  c("Newcastle", "UK", "GB"),
  c("Nottingham", "UK", "GB"),
  c("Cardiff", "UK", "GB"),
  c("Belfast", "UK", "GB"),
  c("Leicester", "UK", "GB"),
  c("Coventry", "UK", "GB"),
  c("Bradford", "UK", "GB"),
  c("Brighton", "UK", "GB"),
  c("Cambridge", "UK", "GB"),
  c("Oxford", "UK", "GB"),
  c("Southampton", "UK", "GB"),
  c("Aberdeen", "UK", "GB"),
  c("Dundee", "UK", "GB"),
  c("Bath", "UK", "GB"),
  c("York", "UK", "GB"),

  // ─────────────────────────────────────────────
  // Canada (15+ cities)
  // ─────────────────────────────────────────────
  cs("Toronto", "ON", "Canada", "CA"),
  cs("Vancouver", "BC", "Canada", "CA"),
  cs("Montreal", "QC", "Canada", "CA"),
  cs("Ottawa", "ON", "Canada", "CA"),
  cs("Calgary", "AB", "Canada", "CA"),
  cs("Edmonton", "AB", "Canada", "CA"),
  cs("Winnipeg", "MB", "Canada", "CA"),
  cs("Quebec City", "QC", "Canada", "CA"),
  cs("Hamilton", "ON", "Canada", "CA"),
  cs("Halifax", "NS", "Canada", "CA"),
  cs("Victoria", "BC", "Canada", "CA"),
  cs("Saskatoon", "SK", "Canada", "CA"),
  cs("Regina", "SK", "Canada", "CA"),
  cs("St. John's", "NL", "Canada", "CA"),
  cs("Kitchener", "ON", "Canada", "CA"),
  cs("Waterloo", "ON", "Canada", "CA"),
  cs("London", "ON", "Canada", "CA"),
  cs("Mississauga", "ON", "Canada", "CA"),

  // ─────────────────────────────────────────────
  // Australia (10+ cities)
  // ─────────────────────────────────────────────
  cs("Sydney", "NSW", "Australia", "AU"),
  cs("Melbourne", "VIC", "Australia", "AU"),
  cs("Brisbane", "QLD", "Australia", "AU"),
  cs("Perth", "WA", "Australia", "AU"),
  cs("Adelaide", "SA", "Australia", "AU"),
  cs("Canberra", "ACT", "Australia", "AU"),
  cs("Hobart", "TAS", "Australia", "AU"),
  cs("Darwin", "NT", "Australia", "AU"),
  cs("Gold Coast", "QLD", "Australia", "AU"),
  cs("Newcastle", "NSW", "Australia", "AU"),
  cs("Wollongong", "NSW", "Australia", "AU"),
  cs("Cairns", "QLD", "Australia", "AU"),

  // ─────────────────────────────────────────────
  // UAE (5+ cities)
  // ─────────────────────────────────────────────
  c("Dubai", "UAE", "AE"),
  c("Abu Dhabi", "UAE", "AE"),
  c("Sharjah", "UAE", "AE"),
  c("Ajman", "UAE", "AE"),
  c("Ras Al Khaimah", "UAE", "AE"),
  c("Fujairah", "UAE", "AE"),

  // ─────────────────────────────────────────────
  // Singapore
  // ─────────────────────────────────────────────
  { city: "Singapore", country: "Singapore", countryCode: "SG", displayLabel: "Singapore" },

  // ─────────────────────────────────────────────
  // Germany (10+ cities)
  // ─────────────────────────────────────────────
  c("Berlin", "Germany", "DE"),
  c("Munich", "Germany", "DE"),
  c("Frankfurt", "Germany", "DE"),
  c("Hamburg", "Germany", "DE"),
  c("Cologne", "Germany", "DE"),
  c("Stuttgart", "Germany", "DE"),
  c("Dusseldorf", "Germany", "DE"),
  c("Dortmund", "Germany", "DE"),
  c("Essen", "Germany", "DE"),
  c("Leipzig", "Germany", "DE"),
  c("Dresden", "Germany", "DE"),
  c("Hanover", "Germany", "DE"),
  c("Nuremberg", "Germany", "DE"),

  // ─────────────────────────────────────────────
  // France (5+ cities)
  // ─────────────────────────────────────────────
  c("Paris", "France", "FR"),
  c("Lyon", "France", "FR"),
  c("Marseille", "France", "FR"),
  c("Toulouse", "France", "FR"),
  c("Nice", "France", "FR"),
  c("Nantes", "France", "FR"),
  c("Strasbourg", "France", "FR"),
  c("Bordeaux", "France", "FR"),
  c("Lille", "France", "FR"),

  // ─────────────────────────────────────────────
  // Netherlands (5+ cities)
  // ─────────────────────────────────────────────
  c("Amsterdam", "Netherlands", "NL"),
  c("Rotterdam", "Netherlands", "NL"),
  c("The Hague", "Netherlands", "NL"),
  c("Utrecht", "Netherlands", "NL"),
  c("Eindhoven", "Netherlands", "NL"),
  c("Groningen", "Netherlands", "NL"),

  // ─────────────────────────────────────────────
  // Japan (5+ cities)
  // ─────────────────────────────────────────────
  c("Tokyo", "Japan", "JP"),
  c("Osaka", "Japan", "JP"),
  c("Kyoto", "Japan", "JP"),
  c("Yokohama", "Japan", "JP"),
  c("Nagoya", "Japan", "JP"),
  c("Fukuoka", "Japan", "JP"),
  c("Sapporo", "Japan", "JP"),
  c("Kobe", "Japan", "JP"),

  // ─────────────────────────────────────────────
  // South Korea (3+ cities)
  // ─────────────────────────────────────────────
  c("Seoul", "South Korea", "KR"),
  c("Busan", "South Korea", "KR"),
  c("Incheon", "South Korea", "KR"),
  c("Daegu", "South Korea", "KR"),
  c("Daejeon", "South Korea", "KR"),

  // ─────────────────────────────────────────────
  // China (10+ cities)
  // ─────────────────────────────────────────────
  c("Beijing", "China", "CN"),
  c("Shanghai", "China", "CN"),
  c("Shenzhen", "China", "CN"),
  c("Guangzhou", "China", "CN"),
  c("Hangzhou", "China", "CN"),
  c("Chengdu", "China", "CN"),
  c("Nanjing", "China", "CN"),
  c("Wuhan", "China", "CN"),
  c("Xi'an", "China", "CN"),
  c("Suzhou", "China", "CN"),
  c("Tianjin", "China", "CN"),
  c("Chongqing", "China", "CN"),
  c("Dalian", "China", "CN"),
  c("Qingdao", "China", "CN"),

  // ─────────────────────────────────────────────
  // Brazil (5+ cities)
  // ─────────────────────────────────────────────
  c("São Paulo", "Brazil", "BR"),
  c("Rio de Janeiro", "Brazil", "BR"),
  c("Brasilia", "Brazil", "BR"),
  c("Salvador", "Brazil", "BR"),
  c("Belo Horizonte", "Brazil", "BR"),
  c("Curitiba", "Brazil", "BR"),
  c("Recife", "Brazil", "BR"),
  c("Porto Alegre", "Brazil", "BR"),
  c("Fortaleza", "Brazil", "BR"),

  // ─────────────────────────────────────────────
  // Mexico (3+ cities)
  // ─────────────────────────────────────────────
  c("Mexico City", "Mexico", "MX"),
  c("Guadalajara", "Mexico", "MX"),
  c("Monterrey", "Mexico", "MX"),
  c("Puebla", "Mexico", "MX"),
  c("Cancun", "Mexico", "MX"),

  // ─────────────────────────────────────────────
  // Southeast Asia (10+ cities)
  // ─────────────────────────────────────────────
  c("Bangkok", "Thailand", "TH"),
  c("Chiang Mai", "Thailand", "TH"),
  c("Phuket", "Thailand", "TH"),
  c("Jakarta", "Indonesia", "ID"),
  c("Bali", "Indonesia", "ID"),
  c("Surabaya", "Indonesia", "ID"),
  c("Kuala Lumpur", "Malaysia", "MY"),
  c("Penang", "Malaysia", "MY"),
  c("Johor Bahru", "Malaysia", "MY"),
  c("Ho Chi Minh City", "Vietnam", "VN"),
  c("Hanoi", "Vietnam", "VN"),
  c("Da Nang", "Vietnam", "VN"),
  c("Manila", "Philippines", "PH"),
  c("Cebu", "Philippines", "PH"),
  c("Phnom Penh", "Cambodia", "KH"),
  c("Yangon", "Myanmar", "MM"),

  // ─────────────────────────────────────────────
  // Middle East (5+ cities)
  // ─────────────────────────────────────────────
  c("Riyadh", "Saudi Arabia", "SA"),
  c("Jeddah", "Saudi Arabia", "SA"),
  c("Doha", "Qatar", "QA"),
  c("Manama", "Bahrain", "BH"),
  c("Muscat", "Oman", "OM"),
  c("Kuwait City", "Kuwait", "KW"),
  c("Amman", "Jordan", "JO"),
  c("Beirut", "Lebanon", "LB"),

  // ─────────────────────────────────────────────
  // Africa (5+ cities)
  // ─────────────────────────────────────────────
  c("Lagos", "Nigeria", "NG"),
  c("Abuja", "Nigeria", "NG"),
  c("Nairobi", "Kenya", "KE"),
  c("Cape Town", "South Africa", "ZA"),
  c("Johannesburg", "South Africa", "ZA"),
  c("Durban", "South Africa", "ZA"),
  c("Cairo", "Egypt", "EG"),
  c("Alexandria", "Egypt", "EG"),
  c("Accra", "Ghana", "GH"),
  c("Addis Ababa", "Ethiopia", "ET"),
  c("Dar es Salaam", "Tanzania", "TZ"),
  c("Casablanca", "Morocco", "MA"),
  c("Tunis", "Tunisia", "TN"),
  c("Kigali", "Rwanda", "RW"),
  c("Kampala", "Uganda", "UG"),

  // ─────────────────────────────────────────────
  // Eastern Europe (5+ cities)
  // ─────────────────────────────────────────────
  c("Warsaw", "Poland", "PL"),
  c("Krakow", "Poland", "PL"),
  c("Wroclaw", "Poland", "PL"),
  c("Prague", "Czech Republic", "CZ"),
  c("Brno", "Czech Republic", "CZ"),
  c("Budapest", "Hungary", "HU"),
  c("Bucharest", "Romania", "RO"),
  c("Cluj-Napoca", "Romania", "RO"),
  c("Sofia", "Bulgaria", "BG"),
  c("Belgrade", "Serbia", "RS"),
  c("Zagreb", "Croatia", "HR"),
  c("Ljubljana", "Slovenia", "SI"),
  c("Tallinn", "Estonia", "EE"),
  c("Riga", "Latvia", "LV"),
  c("Vilnius", "Lithuania", "LT"),
  c("Bratislava", "Slovakia", "SK"),
  c("Kyiv", "Ukraine", "UA"),

  // ─────────────────────────────────────────────
  // Scandinavia (5+ cities)
  // ─────────────────────────────────────────────
  c("Stockholm", "Sweden", "SE"),
  c("Gothenburg", "Sweden", "SE"),
  c("Malmo", "Sweden", "SE"),
  c("Copenhagen", "Denmark", "DK"),
  c("Aarhus", "Denmark", "DK"),
  c("Oslo", "Norway", "NO"),
  c("Bergen", "Norway", "NO"),
  c("Helsinki", "Finland", "FI"),
  c("Tampere", "Finland", "FI"),
  c("Reykjavik", "Iceland", "IS"),

  // ─────────────────────────────────────────────
  // Ireland (2+ cities)
  // ─────────────────────────────────────────────
  c("Dublin", "Ireland", "IE"),
  c("Cork", "Ireland", "IE"),
  c("Galway", "Ireland", "IE"),
  c("Limerick", "Ireland", "IE"),

  // ─────────────────────────────────────────────
  // Israel (2+ cities)
  // ─────────────────────────────────────────────
  c("Tel Aviv", "Israel", "IL"),
  c("Jerusalem", "Israel", "IL"),
  c("Haifa", "Israel", "IL"),

  // ─────────────────────────────────────────────
  // New Zealand (3+ cities)
  // ─────────────────────────────────────────────
  c("Auckland", "New Zealand", "NZ"),
  c("Wellington", "New Zealand", "NZ"),
  c("Christchurch", "New Zealand", "NZ"),
  c("Hamilton", "New Zealand", "NZ"),
  c("Queenstown", "New Zealand", "NZ"),

  // ─────────────────────────────────────────────
  // Switzerland
  // ─────────────────────────────────────────────
  c("Zurich", "Switzerland", "CH"),
  c("Geneva", "Switzerland", "CH"),
  c("Basel", "Switzerland", "CH"),
  c("Bern", "Switzerland", "CH"),
  c("Lausanne", "Switzerland", "CH"),

  // ─────────────────────────────────────────────
  // Austria
  // ─────────────────────────────────────────────
  c("Vienna", "Austria", "AT"),
  c("Graz", "Austria", "AT"),
  c("Salzburg", "Austria", "AT"),

  // ─────────────────────────────────────────────
  // Portugal
  // ─────────────────────────────────────────────
  c("Lisbon", "Portugal", "PT"),
  c("Porto", "Portugal", "PT"),

  // ─────────────────────────────────────────────
  // Spain
  // ─────────────────────────────────────────────
  c("Madrid", "Spain", "ES"),
  c("Barcelona", "Spain", "ES"),
  c("Valencia", "Spain", "ES"),
  c("Seville", "Spain", "ES"),
  c("Malaga", "Spain", "ES"),
  c("Bilbao", "Spain", "ES"),

  // ─────────────────────────────────────────────
  // Italy
  // ─────────────────────────────────────────────
  c("Rome", "Italy", "IT"),
  c("Milan", "Italy", "IT"),
  c("Naples", "Italy", "IT"),
  c("Turin", "Italy", "IT"),
  c("Florence", "Italy", "IT"),
  c("Bologna", "Italy", "IT"),

  // ─────────────────────────────────────────────
  // Belgium
  // ─────────────────────────────────────────────
  c("Brussels", "Belgium", "BE"),
  c("Antwerp", "Belgium", "BE"),
  c("Ghent", "Belgium", "BE"),

  // ─────────────────────────────────────────────
  // Greece
  // ─────────────────────────────────────────────
  c("Athens", "Greece", "GR"),
  c("Thessaloniki", "Greece", "GR"),

  // ─────────────────────────────────────────────
  // Turkey
  // ─────────────────────────────────────────────
  c("Istanbul", "Turkey", "TR"),
  c("Ankara", "Turkey", "TR"),
  c("Izmir", "Turkey", "TR"),

  // ─────────────────────────────────────────────
  // Russia
  // ─────────────────────────────────────────────
  c("Moscow", "Russia", "RU"),
  c("Saint Petersburg", "Russia", "RU"),

  // ─────────────────────────────────────────────
  // Argentina
  // ─────────────────────────────────────────────
  c("Buenos Aires", "Argentina", "AR"),
  c("Cordoba", "Argentina", "AR"),
  c("Rosario", "Argentina", "AR"),

  // ─────────────────────────────────────────────
  // Colombia
  // ─────────────────────────────────────────────
  c("Bogota", "Colombia", "CO"),
  c("Medellin", "Colombia", "CO"),
  c("Cali", "Colombia", "CO"),

  // ─────────────────────────────────────────────
  // Chile
  // ─────────────────────────────────────────────
  c("Santiago", "Chile", "CL"),
  c("Valparaiso", "Chile", "CL"),

  // ─────────────────────────────────────────────
  // Peru
  // ─────────────────────────────────────────────
  c("Lima", "Peru", "PE"),

  // ─────────────────────────────────────────────
  // Taiwan
  // ─────────────────────────────────────────────
  c("Taipei", "Taiwan", "TW"),
  c("Kaohsiung", "Taiwan", "TW"),

  // ─────────────────────────────────────────────
  // Hong Kong & Macau
  // ─────────────────────────────────────────────
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", displayLabel: "Hong Kong" },
  { city: "Macau", country: "Macau", countryCode: "MO", displayLabel: "Macau" },

  // ─────────────────────────────────────────────
  // Pakistan
  // ─────────────────────────────────────────────
  c("Karachi", "Pakistan", "PK"),
  c("Lahore", "Pakistan", "PK"),
  c("Islamabad", "Pakistan", "PK"),

  // ─────────────────────────────────────────────
  // Bangladesh
  // ─────────────────────────────────────────────
  c("Dhaka", "Bangladesh", "BD"),
  c("Chittagong", "Bangladesh", "BD"),

  // ─────────────────────────────────────────────
  // Sri Lanka
  // ─────────────────────────────────────────────
  c("Colombo", "Sri Lanka", "LK"),

  // ─────────────────────────────────────────────
  // Nepal
  // ─────────────────────────────────────────────
  c("Kathmandu", "Nepal", "NP"),

  // ─────────────────────────────────────────────
  // Luxembourg
  // ─────────────────────────────────────────────
  c("Luxembourg City", "Luxembourg", "LU"),

  // ─────────────────────────────────────────────
  // Malta
  // ─────────────────────────────────────────────
  c("Valletta", "Malta", "MT"),
];

/**
 * Searches the MAJOR_CITIES array with case-insensitive substring matching
 * on displayLabel. Results are sorted by relevance:
 *   1. Exact city name match (case-insensitive)
 *   2. City name starts with query
 *   3. Display label starts with query
 *   4. Display label contains query
 *
 * @param query  - The search string to match against
 * @param limit  - Maximum number of results to return (default: 8)
 * @returns        An array of matching CityEntry objects
 */
export function searchCities(query: string, limit: number = 8): CityEntry[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();

  const matches: Array<{ entry: CityEntry; rank: number }> = [];

  for (const entry of MAJOR_CITIES) {
    const cityLower = entry.city.toLowerCase();
    const labelLower = entry.displayLabel.toLowerCase();

    if (cityLower === q) {
      // Rank 0: exact city name match
      matches.push({ entry, rank: 0 });
    } else if (cityLower.startsWith(q)) {
      // Rank 1: city name starts with query
      matches.push({ entry, rank: 1 });
    } else if (labelLower.startsWith(q)) {
      // Rank 2: display label starts with query
      matches.push({ entry, rank: 2 });
    } else if (labelLower.includes(q)) {
      // Rank 3: display label contains query anywhere
      matches.push({ entry, rank: 3 });
    }
  }

  // Sort by rank (ascending), then alphabetically by displayLabel for tie-breaking
  matches.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.entry.displayLabel.localeCompare(b.entry.displayLabel);
  });

  return matches.slice(0, limit).map((m) => m.entry);
}
