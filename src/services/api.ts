import axios from "axios";

const API_BASE_URL = "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete";

export const fetchAutocompleteSuggestions = async () => {
  const response = await axios.get(`${API_BASE_URL}/autocomplete`);

  return response.data;
};
