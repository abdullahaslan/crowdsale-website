// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const qs = require('qs');
const fetch = require('node-fetch');
const { countries } = require('country-data');

const { token } = config.get('onfido');

const ONFIDO_STATUS = {
  UNKOWN: 'unkown',
  CREATED: 'created',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

const ONFIDO_URL_REGEX = /applicants\/([a-z0-9-]+)\/checks\/([a-z0-9-]+)$/i;
const ONFIDO_TAG_REGEX = /^address:(0x[0-9abcdef]+)$/i;

async function _call (endpoint, method = 'GET', data = {}) {
  const body = method === 'POST'
    ? qs.stringify(data, { arrayFormat: 'brackets', encode: false })
    : '';

  const headers = {
    Authorization: `Token token=${token}`
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
  }

  return fetch(`https://api.onfido.com/v2${endpoint}`, {
    method,
    headers,
    body
  })
  .then(async (r) => {
    const rc = r.clone();

    try {
      const json = await r.json();

      return json;
    } catch (error) {
      return rc.text();
    }
  })
  .then((data) => {
    if (data && data.error) {
      console.warn('onfido error', data.error);
      throw new Error(data.error.message);
    }

    return data;
  });
}

function getCheck (applicantId, checkId) {
  return _call(`/applicants/${applicantId}/checks/${checkId}`, 'GET');
}

async function getReports (checkId) {
  const { reports } = await _call(`/checks/${checkId}/reports`, 'GET');

  return reports;
}

async function checkStatus (applicantId, checkId) {
  const { status, result } = await getCheck(applicantId, checkId);

  const pending = status === 'in_progress';
  const valid = status === 'complete' && result === 'clear';

  return { pending, valid };
}

async function createCheck (applicantId, address) {
  const check = await _call(`/applicants/${applicantId}/checks`, 'POST', {
    type: 'express',
    reports: [
      { name: 'document' }
      // { name: 'facial_similarity' }
    ],
    tags: [ `address:${address}` ]
  });

  return { checkId: check.id };
}

async function createApplicant ({ firstName, lastName }) {
  const applicant = await _call('/applicants', 'POST', {
    first_name: firstName,
    last_name: lastName
  });

  const sdkToken = await createToken(applicant.id);

  return { applicantId: applicant.id, sdkToken };
}

async function updateApplicant (applicantId, { firstName, lastName }) {
  await _call(`/applicants/${applicantId}`, 'PUT', {
    first_name: firstName,
    last_name: lastName
  });

  const sdkToken = await createToken(applicantId);

  return { sdkToken };
}

async function createToken (applicantId) {
  const sdk = await _call('/sdk_token', 'POST', {
    applicant_id: applicantId,
    referrer: '*://*/*'
  });

  return sdk.token;
}

/**
 * Verify an URL onfido check and trigger the transaction to the
 * Certifier contract if the check is successful
 *
 * @param {String} href in format: https://api.onfido.com/v2/applicants/<applicant-id>/checks/<check-id>
 */
async function verify (href) {
  if (!ONFIDO_URL_REGEX.test(href)) {
    throw new Error(`wrong onfido URL: ${href}`);
  }

  const [, applicantId, checkId] = ONFIDO_URL_REGEX.exec(href);
  const status = await checkStatus(applicantId, checkId);

  if (status.pending) {
    throw new Error(`onfido check is still pending (${href})`);
  }

  const [{ tags }, reports] = await Promise.all([
    getCheck(applicantId, checkId),
    getReports(checkId)
  ]);
  const report = reports.find((report) => report.result === 'clear');
  const addressTag = tags.find((tag) => ONFIDO_TAG_REGEX.test(tag));

  if (!report) {
    throw new Error(`No report with clear result for this applicant check (${applicantId}/${checkId})`);
  }

  if (!addressTag) {
    throw new Error(`Could not find an address for this applicant check (${applicantId}/${checkId})`);
  }

  const countryCode = report.properties['nationality'] || report.properties['issuing_country'];
  const country = countries[countryCode.toUpperCase()];

  if (!country) {
    throw new Error(`Could not determine country for this applicant (${applicantId}/${checkId})`);
  }

  const [, address] = ONFIDO_TAG_REGEX.exec(addressTag);

  return { address, valid: status.valid, country: country.alpha2.toLowerCase() };
}

module.exports = {
  checkStatus,
  createApplicant,
  createCheck,
  createToken,
  getCheck,
  updateApplicant,
  verify,

  ONFIDO_STATUS
};
