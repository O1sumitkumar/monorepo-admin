import React from "react";
import {
  API_CONFIG,
  API_VERSIONS,
  switchApiVersion,
  type ApiVersion,
} from "../config/api";

const ApiVersionSwitcher: React.FC = () => {
  const [currentVersion, setCurrentVersion] = React.useState(
    API_CONFIG.getVersion()
  );

  const handleVersionChange = (version: ApiVersion) => {
    switchApiVersion(version);
    setCurrentVersion(version);

    // Show a notification
    console.log(`🔄 Switched to API version: ${version}`);
    console.log(`📡 Base URL: ${API_CONFIG.getBaseURL()}`);
  };

  return (
    <div className="api-version-switcher">
      <div className="version-info">
        <h3>API Version Switcher</h3>
        <p>
          Current Version: <strong>{currentVersion}</strong>
        </p>
        <p>
          Base URL: <code>{API_CONFIG.getBaseURL()}</code>
        </p>
      </div>

      <div className="version-buttons">
        <button
          onClick={() => handleVersionChange(API_VERSIONS.V1)}
          className={currentVersion === API_VERSIONS.V1 ? "active" : ""}
        >
          V1 (JWT Auth)
        </button>

        <button
          onClick={() => handleVersionChange(API_VERSIONS.V2)}
          className={currentVersion === API_VERSIONS.V2 ? "active" : ""}
        >
          V2 (Keycloak)
        </button>

        <button
          onClick={() => handleVersionChange(API_VERSIONS.LEGACY)}
          className={currentVersion === API_VERSIONS.LEGACY ? "active" : ""}
        >
          Legacy
        </button>
      </div>

      <div className="version-description">
        <p>
          <strong>V1:</strong> JWT Authentication for Admin Panel
        </p>
        <p>
          <strong>V2:</strong> Keycloak Authentication for External Apps
        </p>
        <p>
          <strong>Legacy:</strong> Backward Compatibility
        </p>
      </div>
    </div>
  );
};

export default ApiVersionSwitcher;
