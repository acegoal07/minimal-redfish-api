# Minimal-RedFish-API
The idea of this API is to provided all the functionality of the parser redfish api but keeping the overall size of the api small this is done by using bare bones packages with no dependencies (e.g. hono) while also combining it with tsup to minify and bundle the code into a single file which is then used to deploy the API.

## Quick Start:
1. Clone the repository
2. run `docker-compose up` to start the API and the mariadb database