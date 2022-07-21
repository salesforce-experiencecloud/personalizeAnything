import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import IsGuest from '@salesforce/user/isGuest';
import UserId from '@salesforce/user/Id';
import ActiveLanguageCode from '@salesforce/i18n/lang';

/**
 * @slot personalizedRegion
 * @slot defaultRegion
 */
export default class PersonalizeAnythingV2 extends LightningElement {
    isAura = false;
    isPreview = false;
    userId = UserId;
    activeLanguageCode = ActiveLanguageCode;
    @api editMode;
    @api criterion1FormFactor;
    @api criterion2AuthenticationStatus;
    userRequestFields = ['User.Id'];
    userRequestActive = false;
    userResponseData;
    @api
    get criterion3SourceValue() {
        return this._criterion3SourceValue;
    }
    @api
    get criterion4SourceValue() {
        return this._criterion4SourceValue;
    }
    @api
    get criterion5SourceValue() {
        return this._criterion5SourceValue;
    }
    set criterion3SourceValue(value) {
        this._criterion3SourceValue = value;
        this.setCriterionSourceValue(value);
        this.shouldPersonalize = this.evaluateRules(this);
    }
    set criterion4SourceValue(value) {
        this._criterion4SourceValue = value;
        this.setCriterionSourceValue(value);
        this.shouldPersonalize = this.evaluateRules(this);
    }
    set criterion5SourceValue(value) {
        this._criterion5SourceValue = value;
        this.setCriterionSourceValue(value);
        this.shouldPersonalize = this.evaluateRules(this);
    }
    @api criterion3ComparisonOperator;
    @api criterion4ComparisonOperator;
    @api criterion5ComparisonOperator;
    @api criterion3TargetValue;
    @api criterion4TargetValue;
    @api criterion5TargetValue;
    @api criterion3ValueType;
    @api criterion4ValueType;
    @api criterion5ValueType;
    criterion3RequestActive = false;
    criterion4RequestActive = false;
    criterion5RequestActive = false;
    @api customLogic;
    shouldPersonalize;
    get displayPersonalize() {
        if (this.userRequestActive || this.criterion3RequestActive || this.criterion4RequestActive || this.criterion5RequestActive) {
            return false;
        }
        return this.editMode ? this.editMode : this.shouldPersonalize;
    }
    get displayDefault() {
        if (this.userRequestActive || this.criterion3RequestActive || this.criterion4RequestActive || this.criterion5RequestActive) {
            return false;
        }
        return this.editMode ? this.editMode : !this.shouldPersonalize;
    }
    defaultReasons = [];


    @wire(getRecord, { recordId: '$userId', fields: '$userRequestFields' })
    wiredRecord({ error, data }) {
        this.userRequestActive = false;
        if (error) {
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            console.log(message);
        } else if (data) {
            if (this.userRequestFields.length > 1 && data.fields) {
                this.userResponseData = data.fields;
                this.shouldPersonalize = this.evaluateRules(this);
            }
        }
    }
    
    connectedCallback() {
        if(window['$A'] !== undefined && window['$A'] !== null) {
            this.isAura = true;
        } else {

            if(this.isInSitePreview())
            {
                this.isPreview = true;
            }

            let context = this;

            window.addEventListener('resize', function(e) {
                context.shouldPersonalize = context.evaluateRules(context);
            });

            document.addEventListener('personalizeAnything:dataResponse', function(e) {
                let payload = e.detail;

                if (payload.index && payload.binding) {
                    if (payload.index === 3 && context.criterion3SourceValue === payload.binding) {
                        context.criterion3RequestActive = false;
                        context.criterion3SourceValue = payload.response;
                        context.shouldPersonalize = context.evaluateRules(context);
                    } else if (payload.index === 4 && context.criterion4SourceValue === payload.binding) {
                        context.criterion4RequestActive = false;
                        context.criterion4SourceValue = payload.response;
                        context.shouldPersonalize = context.evaluateRules(context);
                    } else if (payload.index === 5 && context.criterion5SourceValue === payload.binding) {
                        context.criterion5RequestActive = false;
                        context.criterion5SourceValue = payload.response;
                        context.shouldPersonalize = context.evaluateRules(context);
                    }
                }
            });

            context.shouldPersonalize = context.evaluateRules(context);
        }
    }

    setCriterionSourceValue(value) {
        if (value && typeof value === 'string' && value.startsWith('@User.')) {
            if (!this.userRequestFields.includes(value)) {
                this.userRequestActive = true;
                this.userRequestFields.push(value.substring(1));
            }
        }
    }

    evaluateRules(context) {
        context.defaultReasons = [];

        let criterion1FormFactorRender = true;
        let isMobile = window.innerWidth < 768;
        let isDesktop = window.innerWidth >= 1024;
        let isTablet = !isMobile && !isDesktop;

        if ((context.criterion1FormFactor === 'Desktop-only' && !isDesktop) 
            || (context.criterion1FormFactor === 'Mobile-only' && !isMobile) 
            || (context.criterion1FormFactor === 'Tablet-only' && !isTablet)
            || (context.criterion1FormFactor === 'Mobile and Tablet' && isDesktop)
            || (context.criterion1FormFactor === 'Desktop and Tablet' && isMobile)
            || (context.criterion1FormFactor === 'Desktop and Mobile' && isTablet)) {
            criterion1FormFactorRender = false;
            context.defaultReasons.push('Criterion 1: Form Factor: ' + context.criterion1FormFactor);
        }
        
        let criterion2AuthenticationStatus = true;
        
        if ((context.criterion2AuthenticationStatus === 'Guest' && !IsGuest) 
            || (context.criterion2AuthenticationStatus === 'Authenticated' && IsGuest)) {
            criterion2AuthenticationStatus = false;
            context.defaultReasons.push('Criterion 2: Authentication Status: ' + context.criterion2AuthenticationStatus);
        }

        let criterion3Render = context.evaluateCriterion(context, context.criterion3SourceValue, context.criterion3ComparisonOperator, context.criterion3TargetValue, context.criterion3ValueType, 3);
        let criterion4Render = context.evaluateCriterion(context, context.criterion4SourceValue, context.criterion4ComparisonOperator, context.criterion4TargetValue, context.criterion4ValueType, 4);
        let criterion5Render = context.evaluateCriterion(context, context.criterion5SourceValue, context.criterion5ComparisonOperator, context.criterion5TargetValue, context.criterion5ValueType, 5);

        let defaultHeader = 'Reasons for Showing the Default Region';
        if (context.defaultReasons.length > 0 && context.defaultReasons[0] != defaultHeader) {
            context.defaultReasons.unshift(defaultHeader);
        }

        if (context.customLogic) {
            let customLogic = context.customLogic.toLowerCase();
            customLogic = customLogic.replaceAll('and', '&&').replaceAll('or', '||').replaceAll('not ', '!');
            customLogic = customLogic.replaceAll('1', criterion1FormFactorRender);
            customLogic = customLogic.replaceAll('2', criterion2AuthenticationStatus);
            customLogic = customLogic.replaceAll('3', criterion3Render);
            customLogic = customLogic.replaceAll('4', criterion4Render);
            customLogic = customLogic.replaceAll('5', criterion5Render);
            let customLogicResult = eval(customLogic);
            if (customLogicResult) {
                context.defaultReasons = [];
            } else {
                context.defaultReasons.push('Custom Logic: ' + context.customLogic + '; Custom Logic Eval: ' + customLogic);
            }

            return customLogicResult;
        }

        return criterion1FormFactorRender && criterion2AuthenticationStatus && criterion3Render && criterion4Render && criterion5Render;
    }

    evaluateCriterion(context, criterionSourceValue, criterionOperator, criterionValue, criterionValueType, criterionIndex) {
        if (typeof criterionSourceValue === 'string') {
            if (criterionSourceValue && criterionSourceValue.startsWith('@User.')) {
                let fieldName = criterionSourceValue.substring(criterionSourceValue.indexOf('.') + 1, criterionSourceValue.length);

                if (context.userResponseData && context.userResponseData.hasOwnProperty(fieldName)) {
                    criterionSourceValue = context.userResponseData[fieldName].value;
                }
            } else if (criterionSourceValue === '@language') {
                criterionSourceValue = this.activeLanguageCode;
            } else if (criterionSourceValue === '@currentURL') {
                criterionSourceValue = document.URL;
            } else if (criterionSourceValue === '@userAgent') {
                criterionSourceValue = navigator.userAgent;
            } else if (criterionSourceValue.startsWith('@cookie.')) {
                criterionSourceValue = context.getCookie(criterionSourceValue.split('.')[1]);
            } else if (criterionSourceValue && criterionSourceValue.startsWith('@')) {
                if ((context.criterion3RequestActive && criterionIndex === 3) 
                    || (context.criterion4RequestActive && criterionIndex === 4)
                    || (context.criterion5RequestActive && criterionIndex === 5)) {
                    return false;
                }
                if (criterionIndex === 3) {
                    context.criterion3RequestActive = true;
                } else if (criterionIndex === 4) {
                    context.criterion4RequestActive = true;
                } else if (criterionIndex === 5) {
                    context.criterion5RequestActive = true;
                }
                let criterionParams = criterionSourceValue.split('.');
                let input = criterionParams.length > 1 ? criterionParams[1] : '';

                let payload = { detail: 
                    { binding: criterionSourceValue, index: criterionIndex, identifier: criterionParams[0], input: input }
                };

                document.dispatchEvent(new CustomEvent('personalizeAnything:dataRequest', payload));
                return false;
            }
        }

        if (criterionSourceValue !== undefined && criterionSourceValue !== null) {
            if (criterionValueType === 'String' && typeof criterionSourceValue !== 'string') {
                criterionSourceValue = criterionSourceValue.toString();
            } else if (criterionValueType === 'Number' && typeof criterionSourceValue !== 'number') {
                criterionSourceValue = parseFloat(criterionSourceValue);
            } else if (criterionValueType === 'Boolean' && typeof criterionSourceValue !== 'boolean') {
                if (typeof criterionSourceValue === 'string') {
                    criterionSourceValue = criterionSourceValue.toLowerCase() === 'true' ? true : false;
                } else {
                    criterionSourceValue = Boolean(criterionSourceValue);
                }
            }
        }
   
        let criterionRender = true;
        if (typeof criterionSourceValue === 'string') {
            let criterionSourceValueFormat = criterionSourceValue? criterionSourceValue.toLowerCase() : '';
            let criterionValueFormat = criterionValue ? criterionValue.toLowerCase() : '';
            let validOperators = ['Contains', 'Does Not Contain', 'Is Included Within', 'Is Not Included Within', 'Starts With', 'Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': String: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Contains' && !criterionSourceValueFormat.includes(criterionValueFormat)) 
                || (criterionOperator === 'Does Not Contain' && criterionSourceValueFormat.includes(criterionValueFormat))
                || (criterionOperator === 'Is Included Within' && !criterionValueFormat.includes(criterionSourceValueFormat)) 
                || (criterionOperator === 'Is Not Included Within' && criterionValueFormat.includes(criterionSourceValueFormat))
                || (criterionOperator === 'Starts With' && !criterionSourceValueFormat.startsWith(criterionValueFormat))
                || (criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': String: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
        } else if (typeof criterionSourceValue === 'number') {
            let criterionSourceValueFormat = criterionSourceValue;
            let criterionValueFormat = parseFloat(criterionValue);
            let validOperators = ['Is Greater Than', 'Is Less Than', 'Is Greater Than Or Equals', 'Is Less Than Or Equals', 'Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': Number: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Is Greater Than' && criterionSourceValueFormat < criterionValueFormat) 
                || (criterionOperator === 'Is Less Than' && criterionSourceValueFormat > criterionValueFormat)
                || (criterionOperator === 'Is Greater Than Or Equals' && criterionSourceValueFormat <= criterionValueFormat) 
                || (criterionOperator === 'Is Less Than Or Equals' && criterionSourceValueFormat >= criterionValueFormat)
                || (criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': Number: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
        } else if (typeof criterionSourceValue === 'boolean') {
            let criterionSourceValueFormat = criterionSourceValue;
            let criterionValueFormat = criterionValue.toLowerCase() === 'true' ? true : false;;
            let validOperators = ['Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': Boolean: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + criterionIndex + ': Boolean: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
        }

        return criterionRender;
    }

    getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return '';
    }

    get containerStyle() {
        if (this.isPreview) {
            return 'padding-top: 5px;';
        } else {
            return '';
        }
    }

    get defaultRegionReasonsStyle() {
        if (!this.editMode) {
            return 'display:none;';
        } else {
            return '';
        }
    }

    isInSitePreview()
    {
        if(window !== undefined && window !== null && window.location !== undefined && window.location !== null)
        { 
            try{
                return (window.location.host.indexOf('sitepreview') > 0 || window.location.host.indexOf('livepreview') > 0 || window.location.host.indexOf('live.') > 0);
            } catch(err)
            {
                return (document.URL.indexOf('sitepreview') > 0 || document.URL.indexOf('livepreview') > 0 || document.URL.indexOf('live.') > 0);
            }
        }
        else 
        {
            return (document.URL.indexOf('sitepreview') > 0 || document.URL.indexOf('livepreview') > 0 || document.URL.indexOf('live.') > 0);
        }
    }

}