# sanji-validator [![Build Status](https://travis-ci.org/Sanji-IO/sanji-validator.svg?branch=master)](https://travis-ci.org/MOXA-WEB/sanji-validator)

AngularJS form validation

# Demo
[http://moxa-web.github.io/sanji-validator](http://moxa-web.github.io/sanji-validator)

#Table of contents

- [Requirements](#requirements)
- [Browser Support](#browser-support)
- [Quick Configuration](#quick-configuration)
- [sanjiValidatorConfig provider](#sanjivalidatorconfig-provider)
  - [setValidators](#setvalidators)
  - [setValidMethod](#setvalidmethod)
- [sanjiValidator directive](#sanjivalidator-directive)
- [sanjiValidatorMethod directive](#sanjivalidatormethod-directive)
- [sanjiValidatorSubmit directive](#sanjivalidatorsubmit-directive)
- [beforeElementSelector attribute](#beforeelementselector-attribute)


## Requirements

- jQuery
- AngularJS
- [lodash](https://github.com/lodash/lodash)


## Browser Support

* Chrome
* Firefox 

## Quick Configuration
```sh
bower install sanji-validator
```

This will copy the sanji-validator files into a `bower_components` folder, along with its dependencies. Load the script files in your application:

```html
<script src="bower_components/sanji-validator/dist/sanji-validator.js"></script>
```

```javascript
angular.module('yourApp', ['sanji.validator']);
```

## sanjiValidatorConfig provider

### properties

#### setValidators
Array: Specifies the validators.

#### setValidMethod
String: Default to be watch for global. Can be defined as watch, blur or submit.

### usage
```javascript
angular.module('yourApp')
.run(function(sanjiValidatorConfig) {

  sanjiValidatorConfig.setValidators({

    range: {
      rule: function(value, minlength, maxlength) {    // this field shoud have minlength and maxlength HTML attribute
        var length = value.length;
        return (minlength <= length) && (length <= maxlength);
      },
      error: "The value should be in range ({{minlength}} ~ {{maxlength}})"
    },

    required: {
      error: "This field is required."
    },

    ip: {
      // rule can be defined as RegExp or function
      rule: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      error: "This ip format is invalid."
    }
  });
  sanjiValidatorConfig.setValidMethod('blur');    // set global field validate method
});
```


## sanjiValidator directive
String: a comma separated string which represents the names of validators

### Usage

```html
<form ng-submit="submit()" name="form">
  <label>
    <span>IP: </span>
    <input type="text" ng-model="row.ip" sanji-validator="ip,required">
  </label>
  <label>
    <span>Desc: </span>
    <input type="text" ng-model="row.desc" minlength="10" maxlength="30" sanji-validator="range,required">
  </label>
  <button type="submit" ng-disabled="form.$invalid">Save</button>
</form>
```
## sanjiValidatorMethod directive
String: define the validate method of this form

## sanjiValidatorSubmit directive
put this if you want to validate before ngSubmit.

### Usage
```html
<form ng-submit="submit()" name="form" sanji-validator-method="blur" sanji-validator-submit>
  <label>
    <span>IP: </span>
    <input type="text" ng-model="row.ip" sanji-validator="ip,required">
  </label>
  <button type="submit" ng-disabled="form.$invalid">Save</button>
</form>
```
## beforeElementSelector attribute
If you want your message appears next to certain HTML tag, define before-element-selector attribute.

### Usage
```html
<div class="input-group">
  <input name="idleTime" 
         type="text"
         class="form-control"
         ng-model="current.cellular.idleTime"
         before-element-selector=".input-group"
         sanji-validator="number,required">
  <span class="input-group-addon">sec.</span>
</div>
```
