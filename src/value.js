/*globals window, angular*/
(function() {
  'use strict';

  // lodash is going to be used.
  angular.module('sanji.validator.value', [])
  .value('_', window._)
  .value('sanjiDefaultValidators', {

    email: {
      rule: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i,
      error: "INVALID_EMAIL_FORMAT"
    },

    password: {
      rule: /^(?=.*\d)(?=.*[a-zA-Z]).{6,100}$/,
      error: "INVALID_PASSWORD_FORMAT"
    },

    range: {
      rule: function(value, minlength, maxlength) {
        var length = value.length;
        minlength = +minlength;
        maxlength = +maxlength;
        return (minlength <= length) && (length <= maxlength);
      },
      error: "The value should be in range ({{minlength}} ~ {{maxlength}})"
    },

    community: {
      rule: /^\.{1,100}$/,
      error: "INVALID_COMMUNITY_FORMAT",
      scope: {
        minlength: 1,
        maxlength: 100
      }
    },

    required: {
      error: "THIS_FIELD_IS_REQUIRED"
    },

    ip: {
      rule: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      error: "INVALID_IP_FORMAT"
    },

    dial: {
      rule: /^([0-9#\*]{1,})$/,
      error: "INVALID_DIAL_NUMBER"
    },

    number: {
      rule: /^\s*\d+\s*$/,
      error: "INVALID_NUMBER"
    },

    port: {
      rule: /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
      error: "INVALID_PORT"
    },

    ipsecAuthKey: {
      rule: /[\d]{16}/,
      error: "The key length must equal to 16 characters."
    },

    ipsecEncryptKey: {
      rule: /[\d]{24}/,
      error: "The key length must equal to 24 characters."
    },

    mac: {
      rule: /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/,
      error: "This isn't mac address."
    },

    percentage: {
      rule: /(^(100(?:\.0{1,2})?))|(?!^0*$)(?!^0*\.0*$)^\d{1,2}(\.\d{1,2})?$/,
      error: "The range is 1 - 100 and can't be empty"
    },

    weight: {
      rule: /^(10|[1-9]?)$/,
      error: "The range is 1 - 10 and can't be empty"
    },

    floatNum: {
      rule: /[-+]?(\d*[.])?\d+/,
      error: "This isn't float number and can't be empty"
    },

    passwordLen: {
      rule: /^\w{5,}$/,
      error: "The password is at least 5 length."
    },

    // This is for update account password.
    trackerTimeInterval: {
      rule: function(value) {
        return ((0 < value) && (value <= 120));
      },
      error: "The range is 1 - 120 and can't be empty."
    },

    // This is for update account password.
    confirmPassword: {
      rule: function(value, scope) {
        return (value === scope.$parent.account.newPwd);
      },
      error: "Confirm error."
    },

    wifiWepKeyFormat: {
      rule: function(value) {

        var pattern = '^[0-9a-zA-Z]{5}$|' +
          '^[0-9a-zA-Z]{13}$|' +
          '^[0-9a-zA-Z]{16}$|' +
          '^[0-9a-zA-Z]{29}$|' +
          '^[0-9a-fA-F]{10}$|' +
          '^[0-9a-fA-F]{26}$|' +
          '^[0-9a-fA-F]{32}$|' +
          '^[0-9a-fA-F]{58}$';

        return new RegExp(pattern).test(value);
      },
      error: "The HEX key length must be 10, 26, 32 or 58 and ASCII key length must be 5, 13, 16 or 29."
    },

    wifiPskFormat: {
      rule: function(value) {
        return /^[0-9a-zA-Z]{8,62}$|^[0-9a-fA-F]{64}$/.test(value);
      },
      error: "The HEX key length must be 64 and ASCII key length must be 8 - 63."
    },

    wifiRadiusKeyFormat: {
      rule: function(value) {
        return /^[0-9a-zA-Z]{8,31}$/.test(value);
      },
      error: "The ASCII key length must be 8 - 31."
    }

  });
})();
