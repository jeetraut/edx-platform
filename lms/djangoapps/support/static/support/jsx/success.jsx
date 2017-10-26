/* global gettext */

import React from 'react';
import PropTypes from 'prop-types';

function Success({homepageUrl, dashboardUrl, isLoggedIn}) {
  return (<div className="contact-us-wrapper">
    <div className="row">
      <div className="col-sm-12">
        <h2>{gettext('Contact Us')}</h2>
      </div>
    </div>

    <div className="row">
      <div className="col-sm-12">
        <p>{gettext('Thank you for submitting a request! We will contact you within 24 hours.')}</p>
      </div>
    </div>

    <div className="row">
      <div className="col-sm-12">
        {isLoggedIn &&
        <a
          href={dashboardUrl}
          className="btn btn-secondary help-button"
        >
          {gettext('Go to my Dashboard')}
        </a>
        }
        {!isLoggedIn &&
        <a
          href={homepageUrl}
          className="btn btn-secondary help-button"
        >
          {gettext('Go to edX Home')}
        </a>
        }
      </div>
    </div>

  </div>);
}

Success.propTypes = {
  dashboardUrl: PropTypes.string.isRequired,
  homepageUrl: PropTypes.string.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
};

export default Success;
