import { nearestHospital } from "../services/hospital/nearestHospital.js";

export async function getNearestHospitals(request, response) {
  const location = request.query.location || "current location";
  response.json({
    location,
    hospitals: nearestHospital(location)
  });
}
