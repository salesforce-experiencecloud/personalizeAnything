/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api, wire, track } from 'lwc';
import dataRequest from '@salesforce/apex/PersonalizeHtmlController.dataRequest';
import { CurrentPageReference } from 'lightning/navigation';

import * as generalUtils from 'c/gtaUtilsGeneral';
import {isInSitePreview} from 'c/gtaUtilsExperience';


export default class personalizeHtml2 extends LightningElement {

    @api configJSONString = '{}';

    get configObj() {
        return JSON.parse(this.configJSONString);
    }

    get htmlMarkupOrig() {

        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.htmlMarkup) || this.configObj?.htmlMarkup.trim() === 'undefined') 
        ? '' : this.configObj?.htmlMarkup;
        
        return tmpvalue;
    }

    get htmlMarkup() {
        return this.doReplaceTokens(this.htmlMarkupOrig);
    }

    get scriptTextOrig() {

        let tmpvalue = (generalUtils.isStringEmpty(this.configObj?.scriptText) || this.configObj?.scriptText.trim() === 'undefined') 
        ? '' : this.configObj?.scriptText;
        
        return tmpvalue;
    }

    get scriptText() {
        return this.doReplaceTokens(this.scriptTextOrig);
    }

    get dataRequestFields() {
        let htmlMarkupFields = this.setDataRequestFields(this.htmlMarkupOrig);
        let scriptTextFields = this.setDataRequestFields(this.scriptTextOrig);
        let mergedFields = htmlMarkupFields.concat(scriptTextFields.filter(item2 =>
            !htmlMarkupFields.some(item1 => item1 === item2)
        ));
        return mergedFields;
    }

    get doNotUseLightningFormattedRichText() {
        let tmpvalue = (generalUtils.isObjectEmpty(this.configObj?.doNotUseLightningFormattedRichText)) 
        ? false : this.configObj?.doNotUseLightningFormattedRichText;
        
        return tmpvalue;
    }

    get isInSitePreview() {
        return isInSitePreview(this.pageRef);
    }

    @track pageRef;

    dataProvider;
    shouldRender = false
    renderedDynamicHTML = false;
    renderedDynamicScript = false;
    error;

    @wire(dataRequest, { params: '$dataRequestFields' })
    wiredRecord({ error, data }) {
        if (error) {
            
            if(this.isInSitePreview)
            {
                if(error.body && error.body.message)
                {
                    this.error = error.body.message;
                }
                else 
                {   this.error = 'An error has occurred when retrieving the data provider. Please check the console log for more details.'
                    console.log(e);
                }

                this.shouldRender = true;
            }

        } else if (data) { 
            this.dataProvider = data;

            this.shouldRender = true;

        }
        
        
    }

    @wire(CurrentPageReference) handlePageReference(pageReference) {
        // do something with pageReference.state
        this.pageRef = pageReference;
    }
       

    renderedCallback() {
        if(this.renderedDynamicHTML === false && this.shouldRender === true && this.doNotUseLightningFormattedRichText === true 
            && generalUtils.isStringEmpty(this.htmlMarkup) === false)
        {
            let dynamicHTMLContainerEl = this.template.querySelector('[role="dynamicHTMLContainer"]');
            if(dynamicHTMLContainerEl !== undefined && dynamicHTMLContainerEl !== null)
            {
                dynamicHTMLContainerEl.innerHTML = this.htmlMarkup;
                this.renderedDynamicHTML = true;
            }
        }

        if(this.renderedDynamicScript === false && this.shouldRender === true && this.doNotUseLightningFormattedRichText === true 
            && generalUtils.isStringEmpty(this.scriptText) === false)
        {
            let dynamicScriptContainerEl = this.template.querySelector('[role="dynamicScriptContainer"]');
            if(dynamicScriptContainerEl !== undefined && dynamicScriptContainerEl !== null)
            {
                let dynamicScriptEl = document.createElement('script');
                dynamicScriptEl.text = this.scriptText;
                dynamicScriptContainerEl.appendChild(dynamicScriptEl);
                this.renderedDynamicScript = true;
            }
        }
    }

    setDataRequestFields(html) {
        let tmpvalue = [];
        for (let index = 0; index < html.length; index++) {
            if (html[index] === '@') {
                let endIndex = html.indexOf(';', index);
                tmpvalue.push(html.substring(index + 1, endIndex));
            }
        }
        return tmpvalue;
    }

    doReplaceTokens(text) {

        if(generalUtils.isArrayEmpty(this.dataRequestFields) === false && generalUtils.isObjectEmpty(this.dataProvider) === false)
        {
            
            for (let index = 0; index < this.dataRequestFields.length; index++) {
                let fieldName = this.dataRequestFields[index];
                let fieldNameResponse = fieldName.toLowerCase();
                if (this.dataProvider.hasOwnProperty(fieldNameResponse)) {
                    text = text.replaceAll('@' + fieldName + ';', this.dataProvider[fieldNameResponse]);
                }
            }

        }
        return text;
    }

   

}