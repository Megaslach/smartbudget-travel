declare module 'amadeus' {
  interface AmadeusResponse {
    data: any[];
    result: any;
    statusCode: number;
  }

  interface FlightOffersSearch {
    get(params: {
      originLocationCode: string;
      destinationLocationCode: string;
      departureDate: string;
      returnDate?: string;
      adults: number;
      travelClass?: string;
      currencyCode?: string;
      max?: number;
      nonStop?: boolean;
    }): Promise<AmadeusResponse>;
  }

  interface HotelListByCity {
    get(params: {
      cityCode: string;
      radius?: number;
      radiusUnit?: string;
      hotelSource?: string;
    }): Promise<AmadeusResponse>;
  }

  interface HotelOffersSearch {
    get(params: {
      hotelIds: string;
      checkInDate: string;
      checkOutDate: string;
      adults?: number;
      roomQuantity?: number;
      currency?: string;
    }): Promise<AmadeusResponse>;
  }

  interface Shopping {
    flightOffersSearch: FlightOffersSearch;
    hotelOffersSearch: HotelOffersSearch;
  }

  interface ReferenceData {
    locations: {
      hotels: {
        byCity: HotelListByCity;
      };
      get(params: { keyword: string; subType: string }): Promise<AmadeusResponse>;
    };
  }

  class Amadeus {
    constructor(config: { clientId: string; clientSecret: string; hostname?: string });
    shopping: Shopping;
    referenceData: ReferenceData;
  }

  export = Amadeus;
}
