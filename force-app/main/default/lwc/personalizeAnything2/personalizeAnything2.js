/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import dataRequest from '@salesforce/apex/PersonalizeAnythingController.dataRequest';

import * as generalUtils from 'c/gtaUtilsGeneral';
import {getActiveLanguage, isAura, isInSitePreview} from 'c/gtaUtilsExperience';
import {isUserUnauthenticated} from 'c/gtaUtilsUser';
import * as deviceUtils from 'c/gtaUtilsDevice';

/**
 * @slot personalizedRegion
 * @slot defaultRegion
 */
export default class PersonalizeAnything2 extends LightningElement {

    @api configJSONString = '{}';

    get configObj() {
        return JSON.parse(this.configJSONString);
    }

    get isAura() {
        return isAura();
    }

    get isPreview() {
        return isInSitePreview();
    }

    get activeLanguageCode() {
        return getActiveLanguage();
    }
    
    get debugMode() {
        let tmpvalue = (generalUtils.isObjectEmpty(this.configObj?.debugMode)) 
        ? false : this.configObj?.debugMode;
        return tmpvalue;
    }

    get editMode() {
        let tmpvalue = (generalUtils.isObjectEmpty(this.configObj?.editMode)) 
        ? true : this.configObj?.editMode;
        
        if(this.isPreview === false)
        {
            tmpvalue = false;
        }

        return tmpvalue;
    }

    get editRegion() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.editRegion) || this.configObj?.editRegion.trim() === 'undefined') 
        ? 'Both Regions' : this.configObj?.editRegion;
        return tmpvalue;
    }

    get customLogic() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.customLogic) || this.configObj?.customLogic.trim() === 'undefined') 
        ? '' : this.configObj?.customLogic;
        if(generalUtils.isStringEmpty(tmpvalue) === true)
        {
            let logicArray = ['1','2'];
            if(generalUtils.isArrayEmpty(this.criteriaMap) === false)
            {
                for(let i=0; i<this.criteriaMap.length;i++) 
                {
                    logicArray.push(this.criteriaMap[i].itemNumber + '');
                }
            }
            tmpvalue = logicArray.join(' AND ');
        }
        return tmpvalue;
    }

    get personalizedRegionClassNames() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.personalizedRegionCSSClasses) || this.configObj?.personalizedRegionCSSClasses.trim() === 'undefined') 
        ? '' : this.configObj?.personalizedRegionCSSClasses;
        return tmpvalue;
    }

    get defaultRegionClassNames() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.defaultRegionCSSClasses) || this.configObj?.defaultRegionCSSClasses.trim() === 'undefined') 
        ? '' : this.configObj?.defaultRegionCSSClasses;
        return tmpvalue;
    }

    get criterion1FormFactor() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.formFactor) || this.configObj?.formFactor.trim() === 'undefined') 
        ? 'Any' : this.configObj?.formFactor;
        return tmpvalue;
    }

    get criterion2AuthenticationStatus() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.authenticationStatus) || this.configObj?.authenticationStatus.trim() === 'undefined') 
        ? 'Any' : this.configObj?.authenticationStatus;
        return tmpvalue;
    }

    get dataBindingLoaded() {
        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.dataBindingLoaded)) 
        ? '' : this.configObj?.dataBindingLoaded;
        return tmpvalue;
    }

    get criteriaMap() {
        let tmpvalue = (generalUtils.isObjectEmpty(this.configObj?.criteriaMap)) 
        ? undefined : this.configObj?.criteriaMap;
        
        if(generalUtils.isArrayEmpty(tmpvalue) === false && generalUtils.isArrayEmpty(this.criteriaMapTmp) === true)
        {
            this.criteriaMapTmp = generalUtils.cloneObjectWithJSON(tmpvalue);
            for(let i=0; i<tmpvalue.length; i++)
            {
                this.setCriterionSourceValue(tmpvalue[i].sourceValue);
                this.criteriaMapTmp[i].render = false;

                if(this.criteriaMapTmp[i].dataType === 'customDP')
                {
                    document.addEventListener('personalizeAnything:dataResponse-' + this.criteriaMapTmp[i].id, this.dataResponseListener);
                } 

            }
  
        }
        else if(generalUtils.isArrayEmpty(tmpvalue) === false && generalUtils.isArrayEmpty(this.criteriaMapTmp) === false)
        {
            for(let i=0; i<tmpvalue.length; i++)
            {
                if(tmpvalue[i].dataType === 'dataBinding' && generalUtils.isStringEmpty(this.dataBindingLoaded) === false)
                {
                    this.criteriaMapTmp[i].requestActive = false;
                }
            }
        }
        
        return tmpvalue;
    }

    @track criteriaMapTmp;
    @track pageRef;
    
    dataRequestFields = [];
    dataRequestJSONInput;
    dataRequestActive = false;
    dataResponse;
    hasRerenderedOnce = false;

    @track shouldPersonalize;

    get displayPersonalize() {
        if (this.noActiveRequests === false) {
            return false;
        }

        if(this.editMode === true && this.isPreview === true)
        {
            if (this.editRegion === 'Both Regions' || this.editRegion === 'Personalized Region')
            {
                return true;
            }
            else 
            {
                return false;
            }
        }

        return this.shouldPersonalize;
    }

    get displayDefault() {

        if (this.noActiveRequests === false) {
            return false;
        }

        if(this.editMode === true && this.isPreview === true)
        {
            if (this.editRegion === 'Both Regions' || this.editRegion === 'Default Region')
            {
                return true;
            }
            else 
            {
                return false;
            }
        }

        return !this.shouldPersonalize;
    }

    get displayReasons() {
        return this.editMode && this.isPreview;
    }

    get noActiveRequests() {
        return !this.anyActiveRequests() || (this.editMode === true && this.isPreview === true);
    }
 
    defaultReasons = [];
    resizeListener;
    dataResponseListener;

    @wire(CurrentPageReference)
    setCurrentPageReference(ref) {
        this.pageRef = ref;
        let context = this;
        setTimeout(function() {
            context.shouldPersonalize = context.evaluateRules(context);
        }, 100);
    }

    @wire(dataRequest, { dataRequestJSONInput: '$dataRequestJSONInput' })
    wiredDataResponse({ error, data }) {
        this.dataRequestActive = false;
        if (error) {
            console.log(error);
        } else if (data) {
            let dataResponse = JSON.parse(data);
            if(dataResponse !== undefined && dataResponse !== null && dataResponse.error !== undefined && dataResponse.error !== null && dataResponse.error.trim() !== '')
            {
                console.log(dataResponse.error);
                this.defaultReasons = [];
                this.defaultReasons.push(dataResponse.error);
            }
            else if (this.dataRequestFields.length > 0) {
                this.dataResponse = dataResponse;
                this.shouldPersonalize = this.evaluateRules(this);
            }
        }
    }
    
    connectedCallback() {
        if(this.isAura === false)
        {

            let context = this;

            this.resizeListener = generalUtils.debounce(() => {
                console.log('resize');
                context.shouldPersonalize = context.evaluateRules(context);
            }, 300);

            window.addEventListener('resize', this.resizeListener);

            this.dataResponseListener = function(e) {
                let payload = e.detail;

                if (generalUtils.isObjectEmpty(payload.index) === false && generalUtils.isObjectEmpty(payload.binding) === false && generalUtils.isStringEmpty(payload.uid) === false) {

                    if(context.criteriaMapTmp[payload.index].id === payload.uid) 
                    {
                        context.criteriaMapTmp[payload.index].requestActive = false;
                        context.criteriaMapTmp[payload.index].sourceValue = payload.response;
                        context.shouldPersonalize = context.evaluateRules(context);
                    } 
                }
            }
           
            context.shouldPersonalize = context.evaluateRules(context);

        }
    }

    renderedCallback() {
        generalUtils.consoleLog(this.debugMode, this.defaultReasons.join('\n'), 'Criteria Evaluation Details: ');
        //fix for data binding lag, if there are still data binding requests active but data binding is done loading, then force rerender one more time 
        if(this.hasRerenderedOnce === false && generalUtils.isArrayEmpty(this.criteriaMapTmp) === false)
        {
            let filteredCriteria = this.criteriaMapTmp.filter( item => (item.requestActive === true && item.dataType === 'dataBinding'));
            if(generalUtils.isArrayEmpty(filteredCriteria) === false && generalUtils.isStringEmpty(this.dataBindingLoaded) === false)
            {
                this.shouldPersonalize = this.evaluateRules(this);
                this.hasRerenderedOnce = true;
            }
        }

    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.resizeListener);

        let customDPCriteria = (generalUtils.isArrayEmpty(this.criteriaMapTmp) === false) ? this.criteriaMapTmp.filter( item => item.dataType === 'customDP') : undefined;
        if(generalUtils.isArrayEmpty(customDPCriteria) === false)
        {
            for(let i=0;i<customDPCriteria.length;i++)
            {
                document.removeEventListener('personalizeAnything:dataResponse-' + customDPCriteria[i].id, this.dataResponseListener);
            }
        }
    }

    setCriterionSourceValue(value) {
        if (value && typeof value === 'string' && (value.startsWith('@User.') || value.startsWith('@Contact.') || value.startsWith('@Account.'))) {
            let fieldName = value.substring(1).toLowerCase();
            if (!this.dataRequestFields.includes(fieldName)) {
                this.dataRequestActive = true;
                this.dataRequestFields.push(fieldName);
                this.buildInputMapForDataRequest();
            }
        }
    }

    buildInputMapForDataRequest()
    {
        this.dataRequestJSONInput = undefined;
        let dataRequestInput = {};
        for(let i=0; i < this.dataRequestFields.length; i++)
        {
            if(generalUtils.isArrayEmpty(this.criteriaMap) === false) 
            {
                
                for(let j=0;j<this.criteriaMap.length;j++)
                {

                    let criterion = {};
                    if(generalUtils.isStringEmpty(this.criteriaMap[j].sourceValue) === false  && this.dataRequestFields[i] === this.criteriaMap[j].sourceValue.substring(1).toLowerCase())
                    {
                        criterion.sourceValue = this.criteriaMap[j].sourceValue.toLowerCase();
                        criterion.operator = this.criteriaMap[j].operator;
                        criterion.type = this.criteriaMap[j].type;
                        criterion.targetValue = this.criteriaMap[j].targetValue;
                        criterion.index = this.criteriaMap[j].itemNumber;
                    }
                    else 
                    {
                        criterion = undefined;
                    }

                    if(criterion !== undefined)
                    {
                        dataRequestInput[criterion.index] = criterion;
                    }

                }

            }

        }
        this.dataRequestJSONInput = JSON.stringify(dataRequestInput);
    }

    evaluateRules(context) {
        context.defaultReasons = [];

        let criterion1FormFactorRender = true;
        let isMobile = deviceUtils.convertWidthToFormFactor(window.innerWidth) === 'Small';
        let isDesktop = deviceUtils.convertWidthToFormFactor(window.innerWidth) === 'Large';
        let isTablet = deviceUtils.convertWidthToFormFactor(window.innerWidth) === 'Medium';

        if ((context.criterion1FormFactor === 'Desktop-only' && !isDesktop) 
            || (context.criterion1FormFactor === 'Mobile-only' && !isMobile) 
            || (context.criterion1FormFactor === 'Tablet-only' && !isTablet)
            || (context.criterion1FormFactor === 'Mobile and Tablet' && isDesktop)
            || (context.criterion1FormFactor === 'Desktop and Tablet' && isMobile)
            || (context.criterion1FormFactor === 'Desktop and Mobile' && isTablet)) {
            criterion1FormFactorRender = false;
        }
        context.defaultReasons.push('Criterion 1: Form Factor: ' + context.criterion1FormFactor);
        let criterion2AuthenticationStatus = true;
        
        if ((context.criterion2AuthenticationStatus === 'Guest' && !isUserUnauthenticated()) 
            || (context.criterion2AuthenticationStatus === 'Authenticated' && isUserUnauthenticated())) {
            criterion2AuthenticationStatus = false;
        }
        context.defaultReasons.push('Criterion 2: Authentication Status: ' + context.criterion2AuthenticationStatus);

        if(generalUtils.isArrayEmpty(context.criteriaMap) === false)
        {
            for(let i=0; i<context.criteriaMap.length; i++)
            {
                context.criteriaMapTmp[i].render = context.evaluateCriterion(context, context.criteriaMap[i].sourceValue, context.criteriaMap[i].dataType, context.criteriaMap[i].operator, context.criteriaMap[i].targetValue, context.criteriaMap[i].type, i, context.criteriaMap[i].itemNumber);
            }
        }


        if (context.customLogic) {
            let customLogic = context.customLogic.toLowerCase();
            customLogic = customLogic.replaceAll('and', '&&').replaceAll('or', '||').replaceAll('not ', '!');
            customLogic = customLogic.replaceAll('1', criterion1FormFactorRender);
            customLogic = customLogic.replaceAll('2', criterion2AuthenticationStatus);
            if(generalUtils.isArrayEmpty(context.criteriaMap) === false)
            {
                for(let i=0; i<context.criteriaMap.length; i++)
                {
                    customLogic = customLogic.replaceAll(context.criteriaMap[i].itemNumber + '', context.criteriaMapTmp[i].render);
                }
            }

            let customLogicResult = eval(customLogic);
            let regionShown = '';
            if (customLogicResult) {
                regionShown = 'Personalized';
            } else {
                regionShown = 'Default';
            }
            
            context.defaultReasons.push('Custom Logic: ' + context.customLogic + ';');
            context.defaultReasons.push('Custom Logic Eval: ' + customLogic);
            context.defaultReasons.push('Custom Logic Eval Result: ' + customLogicResult);

            let defaultHeader = 'Current criteria evaluation would result in showing the ' + regionShown + ' Region, for the following reasons:';
            if (context.defaultReasons.length > 0 && context.defaultReasons[0] != defaultHeader) {
                context.defaultReasons.unshift(defaultHeader);
            }

            return customLogicResult;
        }
        let criteriaMapTmp = (generalUtils.isArrayEmpty(context.criteriaMapTmp) === false) ? context.criteriaMapTmp.filter( item => item.render === true) : undefined;
        return criterion1FormFactorRender && criterion2AuthenticationStatus && (generalUtils.isArrayEmpty(criteriaMapTmp) === false);
    }

    evaluateCriterion(context, criterionSourceValue, criterionDataType, criterionOperator, criterionValue, criterionValueType, criterionIndex, criterionNumber) {
        
        if (typeof criterionSourceValue === 'string') {
             if (generalUtils.isStringEmpty(criterionSourceValue) === false && criterionDataType === 'dp' && (criterionSourceValue.toLowerCase().startsWith('@user.') || criterionSourceValue.toLowerCase().startsWith('@contact.') || criterionSourceValue.toLowerCase().startsWith('@account.'))) {
                if (context.dataResponse && context.dataResponse.hasOwnProperty(criterionNumber)) {
                    
                    context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': ' + criterionValueType + ': ' + criterionSourceValue + ' ' + criterionOperator + ' ' + criterionValue);
                    context.criteriaMapTmp[criterionIndex].requestActive = false;
                    return context.dataResponse[criterionNumber];
                }
            } else if (criterionSourceValue === '@language') {
                criterionSourceValue = context.activeLanguageCode;
            } else if (criterionSourceValue === '@currentURL') {
                criterionSourceValue = document.URL;
            } else if (criterionSourceValue === '@userAgent') {
                criterionSourceValue = navigator.userAgent;
            } else if (criterionSourceValue.startsWith('@cookie.')) {
                criterionSourceValue = context.getCookie(criterionSourceValue.split('.')[1]);
            } else if (generalUtils.isStringEmpty(criterionSourceValue) === false && criterionDataType === 'customDP' && criterionSourceValue.startsWith('@')) {
                if (context.criteriaMapTmp[criterionIndex].requestActive === true) {
                    return false;
                }

                if(criterionSourceValue === context.criteriaMapTmp[criterionIndex].sourceValue)
                {
                    context.criteriaMapTmp[criterionIndex].requestActive = true;
                    
                    let criterionParams = criterionSourceValue.split('.');
                    let input = criterionParams.length > 1 ? criterionParams[1] : '';

                    let payload = { detail: 
                        { binding: criterionSourceValue, index: criterionIndex, identifier: criterionParams[0], input: input, uid: context.criteriaMapTmp[criterionIndex].id, responseEventName: 'personalizeAnything:dataResponse-' + context.criteriaMapTmp[criterionIndex].id}
                    };

                    let sendDataRequest = generalUtils.debounce(() => {

                        document.dispatchEvent(new CustomEvent('personalizeAnything:dataRequest', payload));

                    }, 1000);

                    sendDataRequest();
                    
                    return false;
                }
                else 
                {
                    criterionSourceValue = context.criteriaMapTmp[criterionIndex].sourceValue;
                }
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
        if(generalUtils.isObjectEmpty(criterionSourceValue) === true)
        {
            criterionRender = false;
            context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': No Source Value found.');
        }
        else if (typeof criterionSourceValue === 'string') {
            let criterionSourceValueFormat = criterionSourceValue? criterionSourceValue.toLowerCase() : '';
            let criterionValueFormat = criterionValue ? criterionValue.toLowerCase() : '';
            let validOperators = ['Contains', 'Does Not Contain', 'Is Included Within', 'Is Not Included Within', 'Starts With', 'Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': String: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Contains' && !criterionSourceValueFormat.includes(criterionValueFormat)) 
                || (criterionOperator === 'Does Not Contain' && criterionSourceValueFormat.includes(criterionValueFormat))
                || (criterionOperator === 'Is Included Within' && !criterionValueFormat.includes(criterionSourceValueFormat)) 
                || (criterionOperator === 'Is Not Included Within' && criterionValueFormat.includes(criterionSourceValueFormat))
                || (criterionOperator === 'Starts With' && !criterionSourceValueFormat.startsWith(criterionValueFormat))
                || (criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': String: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
            else {
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': String: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
        } else if (typeof criterionSourceValue === 'number') {
            let criterionSourceValueFormat = criterionSourceValue;
            let criterionValueFormat = parseFloat(criterionValue);
            let validOperators = ['Is Greater Than', 'Is Less Than', 'Is Greater Than Or Equals', 'Is Less Than Or Equals', 'Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Number: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Is Greater Than' && criterionSourceValueFormat < criterionValueFormat) 
                || (criterionOperator === 'Is Less Than' && criterionSourceValueFormat > criterionValueFormat)
                || (criterionOperator === 'Is Greater Than Or Equals' && criterionSourceValueFormat <= criterionValueFormat) 
                || (criterionOperator === 'Is Less Than Or Equals' && criterionSourceValueFormat >= criterionValueFormat)
                || (criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Number: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
            else {
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Number: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
        } else if (typeof criterionSourceValue === 'boolean') {
            let criterionSourceValueFormat = criterionSourceValue;
            let criterionValueFormat = criterionValue.toLowerCase() === 'true' ? true : false;;
            let validOperators = ['Equals', 'Does Not Equal'];
            if (!validOperators.includes(criterionOperator)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Boolean: Invalid Operator: ' + criterionOperator);
            } else if ((criterionOperator === 'Equals' && criterionSourceValueFormat !== criterionValueFormat)
                || (criterionOperator === 'Does Not Equal' && criterionSourceValueFormat === criterionValueFormat)) {
                criterionRender = false;
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Boolean: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
            }
            else {
                context.defaultReasons.push('Criterion ' + context.criteriaMapTmp[criterionIndex].itemNumber + ': Boolean: ' + criterionSourceValueFormat + ' ' + criterionOperator + ' ' + criterionValueFormat);
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

    anyActiveRequests() {

        let criteriaMapTmp = (generalUtils.isArrayEmpty(this.criteriaMapTmp) === false) ? this.criteriaMapTmp.filter( item => item.requestActive === true) : undefined;

        return (this.dataRequestActive || (generalUtils.isArrayEmpty(criteriaMapTmp) === false));
    }

}