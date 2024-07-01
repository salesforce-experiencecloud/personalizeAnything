import { LightningElement, track, api } from 'lwc';
import * as generalUtils from 'c/gtaUtilsGeneral';
import * as componentUtils from 'c/gtaUtilsComponent';

const typeDelay = 1000;
const defaultCSSClasses = 'slds-m-bottom_medium';
const propertyEditorWidthStyle = ':root {--cb-property-editor-width: 400px;}';

export default class PersonalizeHtmlCpe extends LightningElement {

    uuid = generalUtils.generateUniqueIdentifier();


    @track showModal = false;
    @track showScriptTextModal = false;

    @track propInputs = {
        /*
            template: {
                key: 'template', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Template', //label used for html lighting-input tag
                type: 'text', //type used for html lightning-input tag
                help: 'template', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'general.template', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handleTestChange, //onchange handler for html lightning-input tag
            },
        */
            doNotUseLightningFormattedRichText: {
                key: 'doNotUseLightningFormattedRichText', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Do Not Use Lightning Formatted Rich Text', //label used for html lighting-input tag
                type: 'toggle', //type used for html lightning-input tag
                help: 'If checked the component will dynamically insert the html instead of using the Lightning Formatted Rich Text component. Note that turning this option is less secure as it does not sanitize non-secure tags.', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'doNotUseLightningFormattedRichText', //property path within the value object
                value: false, //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handleDoNotUseLightningFormattedRichTextChange, //onchange handler for html lightning-input tag
            },
            htmlMarkup: {
                key: 'htmlMarkup', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'HTML Markup', //label used for html lighting-input tag
                buttonLabel: 'Set',
                type: 'text', //type used for html lightning-input tag
                help: 'Use HTML with syntax such as @User.Name; @Contact.Name; @Account.Name;', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'htmlMarkup', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' customTextArea slds-grid slds-size_1-of-1', //css classes for html lightning-input tag
                clickHandler: this.handleHtmlMarkupClick, //onchange handler for html lightning-input tag
            },
            scriptText: {
                key: 'scriptText', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'HTML Script', //label used for html lighting-input tag
                buttonLabel: 'Set',
                type: 'text', //type used for html lightning-input tag
                help: 'HTML Script with syntax such as @User.Name; @Contact.Name; @Account.Name; Note: do not include <script> tags.', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'scriptText', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' customTextArea slds-grid slds-size_1-of-1', //css classes for html lightning-input tag
                clickHandler: this.handleScriptTextClick, //onchange handler for html lightning-input tag
            },

        };


    @api
    get value() {
        return this._value;
    }

    set value(value) {
       
        let valuetmp = JSON.parse(value);
        let isValueUndefined = this._value === undefined;
        this._value = {};
        let hasValueChanged = false;

        for (let key in this.propInputs) {
            
            if(generalUtils.objectHasProperty(this.propInputs, key) && this.propInputs[key].doSetDefaultValue === true)
            {
                let tmpVal = generalUtils.getObjPropValue(valuetmp, this.propInputs[key].valuePath);
                if(generalUtils.isObjectEmpty(tmpVal))
                {
                    tmpVal = this.propInputs[key].value;
                    if(((this.propInputs[key].type === 'text' || this.propInputs[key].type === 'select' ||  this.propInputs[key].type === 'search') 
                        && !generalUtils.isStringEmpty(tmpVal)) 
                        ||
                        ((this.propInputs[key].type === 'toggle' || this.propInputs[key].type === 'checkbox' || this.propInputs[key].type === 'number' ) && !generalUtils.isObjectEmpty(tmpVal)))
                    {
                        valuetmp = generalUtils.setObjPropValue(valuetmp, this.propInputs[key].valuePath, tmpVal);
                        value = JSON.stringify(valuetmp);
                        hasValueChanged = true;
                    }
                    
                }
                if(this.propInputs[key].value !== tmpVal)
                {
                    this.propInputs[key].value = tmpVal;
                    if(key === 'htmlMarkup' || key === 'scriptText')
                    {
                        if(!generalUtils.isStringEmpty(this.propInputs[key].value))
                        {
                            this.propInputs[key].buttonLabel = 'Edit';                
                        } 
                    }
                }
            }

            

        }

        this._value = value;
        if(hasValueChanged === true)
        {
            this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: value}}));
        }
    }

    get modalClass() {
        let classNames = 'slds-modal slds-modal_large slds-fade-in-open';
        return classNames;
    }

    get displayBackdrop() {
        return this.showModal || this.showScriptTextModal;
    }

    connectedCallback() {

        let styleEl = document.createElement('style');
        styleEl.classList.add('ccnavmenus-' + this.uuid);
        styleEl.innerHTML = propertyEditorWidthStyle;
        document.body.appendChild(styleEl);


    }

    disconnectedCallback() {
        let styleEl = document.body.querySelector('style.ccnavmenus-' + this.uuid);
        if(generalUtils.isObjectEmpty(styleEl) === false)
        {
            styleEl.remove();
        }
    }

    getValueObj()
    {
        let tmpvalueObj = (generalUtils.isStringEmpty(this.value)) ? {} : JSON.parse(this.value);
        return tmpvalueObj;
    }

    displayInputErrorByDataKey(identifier, text)
    {
        componentUtils.displayLightningInputError(this, '[data-key="'+identifier+'"]', text);
    }



    //handler methods
    handleDoNotUseLightningFormattedRichTextChange(e) {
        this.propInputs.doNotUseLightningFormattedRichText.value = e.detail.checked;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.doNotUseLightningFormattedRichText = this.propInputs.doNotUseLightningFormattedRichText.value;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));
    }

    handleHtmlMarkupClick(e) {
        this.showModal = true;
    }

    handleCloseModal(e) {
        this.showModal = false;
    }

    handleSaveHtmlMarkup(e) {
        let tmpEl = this.template.querySelector('[data-key="' + this.propInputs.htmlMarkup.key + '"]');

        this.propInputs.htmlMarkup.value = tmpEl.value;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.htmlMarkup = this.propInputs.htmlMarkup.value;

        this.propInputs.htmlMarkup.buttonLabel = (generalUtils.isStringEmpty(this.propInputs.htmlMarkup.value) === false) ? 'Edit' : 'Set' ;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));

        this.handleCloseModal();

    }

    handleScriptTextClick(e) {
        this.showScriptTextModal = true;
    }

    handleCloseScriptTextModal(e) {
        this.showScriptTextModal = false;
    }

    handleSaveScriptText(e) {
        let tmpEl = this.template.querySelector('[data-key="' + this.propInputs.scriptText.key + '"]');

        this.propInputs.scriptText.value = tmpEl.value;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.scriptText = this.propInputs.scriptText.value;

        this.propInputs.scriptText.buttonLabel = (generalUtils.isStringEmpty(this.propInputs.scriptText.value) === false) ? 'Edit' : 'Set' ;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));

        this.handleCloseScriptTextModal();

    }


}