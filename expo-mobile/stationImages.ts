// Bundled photos of the Greenwood Event Center chargers (Kumasi).
// Keyed by OCPP station ID, and by "stationId:connectorId" for individual guns.
export const STATION_IMAGES: Record<string, any> = {
  'CL-KSI-001': require('./assets/stations/greenwood-site.jpg'),
  'CL-KSI-002': require('./assets/stations/station2-40kw.jpg'),
};

export const CONNECTOR_IMAGES: Record<string, any> = {
  'CL-KSI-001:1': require('./assets/stations/station1-outlet-a.jpg'),
  'CL-KSI-001:2': require('./assets/stations/station1-outlet-b.jpg'),
};
