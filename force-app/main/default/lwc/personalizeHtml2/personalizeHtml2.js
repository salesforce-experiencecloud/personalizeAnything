/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api, wire } from 'lwc';
import dataRequest from '@salesforce/apex/PersonalizeHtmlController.dataRequest';

export default class personalizeHtml extends LightningElement {

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

        let tmpvalue = this.htmlMarkupOrig;
        
        for (let index = 0; index < this.dataRequestFields.length; index++) {
            let fieldName = this.dataRequestFields[index];
            let fieldNameResponse = fieldName.toLowerCase();
            if (this.dataProvider.hasOwnProperty(fieldNameResponse)) {
                tmpvalue = tmpvalue.replaceAll('@' + fieldName + ';', this.dataProvider[fieldNameResponse]);
            }
        }

        return tmpvalue;
    }

    get dataRequestFields() {
        return this.setDataRequestFields(this.htmlMarkupOrig);
    }

    get doNotUseLightningFormattedRichText() {
        let tmpvalue = (generalUtils.isObjectEmpty(this.configObj?.doNotUseLightningFormattedRichText)) 
        ? false : this.configObj?.doNotUseLightningFormattedRichText;
        
        return tmpvalue;
    }

    get isInSitePreview() {
        let url = document.URL;
        
        return (url.indexOf('sitepreview') > 0 
            || url.indexOf('livepreview') > 0
            || url.indexOf('live-preview') > 0 
            || url.indexOf('live.') > 0
            || url.indexOf('.builder.') > 0);
    }


    dataProvider;
    shouldRender = false
    renderedDynamicHTML = false;
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

    renderedCallback() {
        if(this.renderedDynamicHTML === false && this.shouldRender === true && this.doNotUseLightningFormattedRichText === true 
            && this.htmlMarkup !== undefined && this.htmlMarkup !== null && this.htmlMarkup.trim() !== '')
        {
            let dynamicHTMLContainerEl = this.template.querySelector('[role="dynamicHTMLContainer"]');
            if(dynamicHTMLContainerEl !== undefined && dynamicHTMLContainerEl !== null)
            {
                dynamicHTMLContainerEl.innerHTML = this.htmlMarkup;
                this.renderedDynamicHTML = true;
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

   

}