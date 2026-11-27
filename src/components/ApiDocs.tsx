import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import specUrl from "../../openapi/openapi.yaml?url";
import "./ApiDocs.css";

/* The documentation page of the API, rendered from openapi.yaml itself. */
export default function ApiDocs() {
  return (
    <section className="docs" aria-label="API documentation">
      <SwaggerUI url={specUrl} docExpansion="list" defaultModelsExpandDepth={-1} tryItOutEnabled={false} />
    </section>
  );
}
