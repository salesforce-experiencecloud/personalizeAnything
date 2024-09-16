import { LightningElement, track, api } from 'lwc';
import * as generalUtils from 'c/gtaUtilsGeneral';
import * as componentUtils from 'c/gtaUtilsComponent';

const typeDelay = 1000;
const defaultCSSClasses = 'slds-m-bottom_medium';
const propertyEditorWidthStyle = ':root {--cb-property-editor-width: 400px;}';


export default class PersonalizeAnythingCpe extends LightningElement {

    uuid = generalUtils.generateUniqueIdentifier();

    operatorOptions = [
        { label: 'Contains', value: 'Contains' },
        { label: 'Does Not Contain', value: 'Does Not Contain' },
        { label: 'Is Included Within', value: 'Is Included Within' },
        { label: 'Is Not Included Within', value: 'Is Not Included Within' },
        { label: 'Starts With', value: 'Starts With' },
        { label: 'Equals', value: 'Equals' },
        { label: 'Does Not Equal', value: 'Does Not Equal'},
        { label: 'Is Greater Than', value: 'Is Greater Than'},
        { label: 'Is Less Than', value: 'Is Less Than'},
        { label: 'Is Greater Than Or Equals', value: 'Is Greater Than Or Equals'},
        { label: 'Is Less Than Or Equals', value: 'Is Less Than Or Equals'}
   ];
   
   stringOperatorOptions = [
        { label: 'Contains', value: 'Contains' },
        { label: 'Does Not Contain', value: 'Does Not Contain' },
        { label: 'Is Included Within', value: 'Is Included Within' },
        { label: 'Is Not Included Within', value: 'Is Not Included Within' },
        { label: 'Starts With', value: 'Starts With' },
        { label: 'Equals', value: 'Equals' },
        { label: 'Does Not Equal', value: 'Does Not Equal'}
   ];

   numberOperatorOptions = [
        { label: 'Equals', value: 'Equals' },
        { label: 'Does Not Equal', value: 'Does Not Equal'},
        { label: 'Is Greater Than', value: 'Is Greater Than'},
        { label: 'Is Less Than', value: 'Is Less Than'},
        { label: 'Is Greater Than Or Equals', value: 'Is Greater Than Or Equals'},
        { label: 'Is Less Than Or Equals', value: 'Is Less Than Or Equals'}
   ];

   booleanOperatorOptions = [
        { label: 'Equals', value: 'Equals' },
        { label: 'Does Not Equal', value: 'Does Not Equal'},
   ];

   typeOptions = [
       { label: 'String', value: 'String' },
       { label: 'Boolean', value: 'Boolean' },
       { label: 'Number', value: 'Number' },
   ];

   booleanTargetOptions = [
    { label: 'True', value: 'true' },
    { label: 'False', value: 'false' }
   ];

    @track showModal = false;
    @track criteriaMapTmp;
    @track exportError;
    @track importModalOpen = false;
    @track importError;

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
            editMode: {
                key: 'editMode', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Edit Mode', //label used for html lighting-input tag
                type: 'toggle', //type used for html lightning-input tag
                help: 'Turn on edit mode to see and configure components for all regions', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'editMode', //property path within the value object
                value: true, //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handleEditModeChange, //onchange handler for html lightning-input tag
            },
            editRegion: {
                key: 'editRegion', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Edit Region', //label used for html lighting-input tag
                type: 'select', //type used for html lightning-input tag
                help: 'Choose which region to edit', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'editRegion', //property path within the value object
                value: 'Both Regions', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' slds-m-top_medium', //css classes for html lightning-input tag
                changeHandler: this.handleEditRegionChange, //onchange handler for html lightning-input tag
                options:[
                    {label: 'Both Regions', value: 'Both Regions'},
                    {label: 'Personalized Region', value: 'Personalized Region'},
                    {label: 'Default Region', value: 'Default Region'}
                ],
            },
            formFactor: {
                key: 'formFactor', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Criterion 1: Form Factor', //label used for html lighting-input tag
                type: 'select', //type used for html lightning-input tag
                help: 'Evaluates form factor at runtime and checks against the selected value', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'formFactor', //property path within the value object
                value: 'Any', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' slds-m-top_medium slds-size_12-of-12 slds-p-horizontal_medium', //css classes for html lightning-input tag
                changeHandler: undefined, //onchange handler for html lightning-input tag
                options:[
                    {label: 'Any', value: 'Any'},
                    {label: 'Desktop-only', value: 'Desktop-only'},
                    {label: 'Mobile-only', value: 'Mobile-only'},
                    {label: 'Tablet-only', value: 'Tablet-only'},
                    {label: 'Mobile and Tablet', value: 'Mobile and Tablet'},
                    {label: 'Desktop and Tablet', value: 'Desktop and Tablet'},
                    {label: 'Desktop and Mobile', value: 'Desktop and Mobile'}
                ],
            },
            authenticationStatus: {
                key: 'authenticationStatus', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Criterion 2: Authentication Status', //label used for html lighting-input tag
                type: 'select', //type used for html lightning-input tag
                help: 'Evaluates the authentication status of the user at runtime and checks against the value selected', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'authenticationStatus', //property path within the value object
                value: 'Any', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' slds-m-top_medium slds-size_12-of-12 slds-p-horizontal_medium', //css classes for html lightning-input tag
                changeHandler: undefined, //onchange handler for html lightning-input tag
                options:[
                    {label: 'Any', value: 'Any'},
                    {label: 'Authenticated', value: 'Authenticated'},
                    {label: 'Guest', value: 'Guest'}
                ],
            },
            criteriaMap: {
                key: 'criteriaMap', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Criteria Configuration', //label used for html lighting-input tag
                buttonLabel: 'Configure',
                type: 'arrayObject', //type used for html lightning-input tag
                help: 'Configure criteria for personalization.', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'criteriaMap', //property path within the value object
                value: undefined, //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + 'slds-m-top_medium', //css classes for html lightning-input tag
                clickHandler: this.handleCriteriaMapClick, //onchange handler for html lightning-input tag
            },
            customLogic: {
                key: 'customLogic', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Custom Logic', //label used for html lighting-input tag
                type: 'text', //type used for html lightning-input tag
                help: 'Define the logic statement for how the criteria should be evaluated. If left blank, the criteria will be evaluated on an "AND" basis, requiring all of them to match in order for the personalized region to display. e.g. 1 AND 2 AND 3 AND 4 AND 5 ---Example: (1 and 2) or (3 and 4) or !5', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'customLogic', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + ' slds-m-top_medium slds-grid slds-size_1-of-1', //css classes for html lightning-input tag
                changeHandler: this.handleCustomLogicChange, //onchange handler for html lightning-input tag
            },
            personalizedRegionCSSClasses: {
                key: 'personalizedRegionCSSClasses', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Personalized Region Classes', //label used for html lighting-input tag
                type: 'text', //type used for html lightning-input tag
                help: 'CSS Class names to uniquely target the personalized region styles', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'personalizedRegionCSSClasses', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handlePersonalizedRegionClassesChange, //onchange handler for html lightning-input tag
            },
            defaultRegionCSSClasses: {
                key: 'defaultRegionCSSClasses', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Default Region Classes', //label used for html lighting-input tag
                type: 'text', //type used for html lightning-input tag
                help: 'CSS Class names to uniquely target the default region styles', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'defaultRegionCSSClasses', //property path within the value object
                value: '', //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handleDefaultRegionClassesChange, //onchange handler for html lightning-input tag
            },
            debugMode: {
                key: 'debugMode', //key used for html lightning-input tag identifier, must match key in propInputs
                label: 'Debug Mode', //label used for html lighting-input tag
                type: 'toggle', //type used for html lightning-input tag
                help: 'Turn on debug mode to see console messages and criteria evaluation details', //tooltip / help text used for html lightning-input tag
                required: false, //required used for html lightning-input tag
                valuePath: 'debugMode', //property path within the value object
                value: false, //default value
                doSetDefaultValue: true, //set to true to set this lightning-input's default value to what is stored in the value object
                classes: defaultCSSClasses + '', //css classes for html lightning-input tag
                changeHandler: this.handleDebugModeChange, //onchange handler for html lightning-input tag
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
                    if(this.propInputs[key].type === 'arrayObject' && key === 'criteriaMap')
                    {
                        this.criteriaMapTmp = generalUtils.cloneObjectWithJSON(tmpVal);
                    }
                    this.propInputs[key].value = tmpVal;
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
        return this.showModal || this.importModalOpen;
    }

    connectedCallback() {

        let styleEl = document.createElement('style');
        styleEl.classList.add('personalizeAnything-' + this.uuid);
        styleEl.innerHTML = propertyEditorWidthStyle;
        document.body.appendChild(styleEl);


    }

    disconnectedCallback() {
        let styleEl = document.body.querySelector('style.personalizeAnything-' + this.uuid);
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
    handleEditModeChange(e) {
        this.propInputs.editMode.value = e.detail.checked;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.editMode = this.propInputs.editMode.value;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));
    }

    handleEditRegionChange(e) {

        let selectedValue = e.detail.value;
        this.propInputs.editRegion.value = selectedValue;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.editRegion = selectedValue;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));
    }

    handleCriteriaMapClick(e) {
        this.showModal = true;
    }

    handleCloseModal(e) {
        this.showModal = false;
    }

    handleAddCriteriaMap(e) {

        this.criteriaMapTmp = (generalUtils.isObjectEmpty(this.criteriaMapTmp)) ? [] : this.criteriaMapTmp;
        let tmpRow = {};
        tmpRow.id = generalUtils.generateUniqueIdentifier();
        tmpRow.itemNumber = this.criteriaMapTmp.length + 3;
        tmpRow.sourceValue = '';
        tmpRow.operator = 'Contains';
        tmpRow.operatorOptions = this.stringOperatorOptions;
        tmpRow.targetValue = '';
        tmpRow.type = 'String';
        tmpRow.inputType = 'text';
        tmpRow.inputIsSelect = false;
    
        this.criteriaMapTmp.push(tmpRow);
    }

    handleCriterionTypeChange(e) {
        let currId = e.target.dataset.id;
        let inputvalue = e.detail.value;
        
        if(generalUtils.isStringEmpty(currId) === false && generalUtils.isStringEmpty(inputvalue) === false)
        {
            for(let i=0;i<this.criteriaMapTmp.length; i++)
            {
                if(this.criteriaMapTmp[i].id === currId)
                {

                    this.criteriaMapTmp[i].type = inputvalue;
                    this.criteriaMapTmp[i].targetValue = '';
                    this.criteriaMapTmp[i].inputIsSelect = false;

                    if(this.criteriaMapTmp[i].type === 'Boolean')
                    {
                        this.criteriaMapTmp[i].operatorOptions = this.booleanOperatorOptions;
                        this.criteriaMapTmp[i].operator = 'Equals';
                        this.criteriaMapTmp[i].inputIsSelect = true;
                        this.criteriaMapTmp[i].targetValue = 'true';
                    }
                    else if(this.criteriaMapTmp[i].type === 'Number')
                    {
                        this.criteriaMapTmp[i].operatorOptions = this.numberOperatorOptions;
                        this.criteriaMapTmp[i].operator = 'Equals';
                        this.criteriaMapTmp[i].inputType = 'number';
                    }
                    else 
                    {
                        this.criteriaMapTmp[i].operatorOptions = this.stringOperatorOptions;
                        this.criteriaMapTmp[i].operator = 'Contains';
                        this.criteriaMapTmp[i].inputType = 'text';
                    }

                    let currOperatorEl = this.template.querySelector('[data-type="operator"][data-id="' + currId  + '"]');

                    if(generalUtils.isObjectEmpty(currOperatorEl) === false)
                    {
                        currOperatorEl.value = this.criteriaMapTmp[i].operator;
                    }

                    break;

                }
            }
        }
    }

    handleClearCriteriaMap(e) {
        this.criteriaMapTmp = undefined;
    }

    handleDeleteCriteriaMap(e) {
        let id = e.currentTarget.dataset.id;

        this.criteriaMapTmp = this.criteriaMapTmp.filter( item => item.id !== id);
        this.criteriaMapTmp = (this.criteriaMapTmp.length > 0) ? this.criteriaMapTmp : undefined ;
        if(generalUtils.isArrayEmpty(this.criteriaMapTmp) === false)
        {
            for(let i=0; i<this.criteriaMapTmp.length; i++)
            {
                this.criteriaMapTmp[i].itemNumber = i + 3;
            }
        }

    }

    handleSaveCriteriaMap(e) {

        let formFactorEl = this.template.querySelector('[data-key="' + this.propInputs.formFactor.key + '"]');

        this.propInputs.formFactor.value = formFactorEl.value;


        let authenticationStatusEl = this.template.querySelector('[data-key="' + this.propInputs.authenticationStatus.key + '"]');

        this.propInputs.authenticationStatus.value = authenticationStatusEl.value;


        let customLogicEl = this.template.querySelector('[data-key="' + this.propInputs.customLogic.key + '"]');

        this.propInputs.customLogic.value = customLogicEl.value;


        if(generalUtils.isArrayEmpty(this.criteriaMapTmp) === false)
        {

            for(let i=0;i<this.criteriaMapTmp.length;i++)
            {
                let currId = this.criteriaMapTmp[i].id;
                let relatedEls = this.template.querySelectorAll('[data-id="' + currId + '"]');

                if(generalUtils.isArrayEmpty(relatedEls) === false)
                {
                    for(let j=0;j<relatedEls.length;j++)
                    {
                        let currValue = relatedEls[j].value;
                        if(relatedEls[j].dataset.type === 'sourceValue')
                        {
                            this.criteriaMapTmp[i].sourceValue = currValue;
                            if (currValue && typeof currValue === 'string' && 
                                (currValue.toLowerCase().startsWith('@user.') || currValue.toLowerCase().startsWith('@contact.') || currValue.toLowerCase().startsWith('@account.'))
                            ) 
                            {
                                this.criteriaMapTmp[i].requestActive = true;
                                this.criteriaMapTmp[i].dataType = 'dp';
                            }
                            else if (currValue && typeof currValue === 'string' && 
                                ( currValue.startsWith('{!Item.'))
                            ) 
                            {
                                this.criteriaMapTmp[i].requestActive = true;
                                this.criteriaMapTmp[i].dataType = 'dataBinding';
                            }
                            else if (currValue && typeof currValue === 'string' && 
                                ( currValue.startsWith('@'))
                            ) 
                            {
                                this.criteriaMapTmp[i].requestActive = false;
                                this.criteriaMapTmp[i].dataType = 'customDP';
                            }
                            else
                            {
                                this.criteriaMapTmp[i].requestActive = false;
                                this.criteriaMapTmp[i].dataType = 'other';
                            }
                        }
                        else if(relatedEls[j].dataset.type === 'operator')
                        {
                            this.criteriaMapTmp[i].operator = currValue;
                        }
                        else if(relatedEls[j].dataset.type === 'targetValue')
                        {
                            this.criteriaMapTmp[i].targetValue = currValue;
                        }
                        else if(relatedEls[j].dataset.type === 'type')
                        {
                            this.criteriaMapTmp[i].type = currValue;
                        }
                    }
                }
            }

        }

        this.propInputs.criteriaMap.value = this.criteriaMapTmp;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.formFactor = this.propInputs.formFactor.value;
        tmpvalueObj.authenticationStatus = this.propInputs.authenticationStatus.value;
        tmpvalueObj.customLogic = this.propInputs.customLogic.value;
        tmpvalueObj.criteriaMap = this.propInputs.criteriaMap.value;
        tmpvalueObj.dataBindingLoaded = '{!Item.CreatedDate}{!Item.publishedDate}{!Item.body.publishedDate}';


        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));

        this.handleCloseModal();

    }

    handlePersonalizedRegionClassesChange(e) {

        window.clearTimeout(this.propInputs.personalizedRegionCSSClasses.textDelayTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.propInputs.personalizedRegionCSSClasses.textDelayTimeout = setTimeout(() => {

            let inputvalue = e.detail.value.trim();
            this.propInputs.personalizedRegionCSSClasses.value = inputvalue;

            let tmpvalueObj = this.getValueObj();
            tmpvalueObj.personalizedRegionCSSClasses = inputvalue;

            this.dispatchEvent(new CustomEvent("valuechange", 
                {detail: {value: JSON.stringify(tmpvalueObj)}}));

        }, typeDelay);
        
    }

    handleDefaultRegionClassesChange(e) {

        window.clearTimeout(this.propInputs.defaultRegionCSSClasses.textDelayTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.propInputs.defaultRegionCSSClasses.textDelayTimeout = setTimeout(() => {

            let inputvalue = e.detail.value.trim();
            this.propInputs.defaultRegionCSSClasses.value = inputvalue;

            let tmpvalueObj = this.getValueObj();
            tmpvalueObj.defaultRegionCSSClasses = inputvalue;

            this.dispatchEvent(new CustomEvent("valuechange", 
                {detail: {value: JSON.stringify(tmpvalueObj)}}));

        }, typeDelay);
        
    }

    handleExportConfig(e)
    {
        this.exportError = undefined;
        let tmpvalueObj = this.getValueObj();
        if(!generalUtils.isObjectEmpty(tmpvalueObj))
        {
            generalUtils.downloadTextFile('PersonalizeAnything-config.json', JSON.stringify(tmpvalueObj, undefined, 4));
        }
        else
        {
            this.exportError = 'Config not found.';
        }
    }

    openImportModal() 
    {
        this.importModalOpen = true;
    }

    closeImportModal() 
    {
        this.importModalOpen = false;
    }

    handleImportConfig(e)
    {
        this.importError = undefined;
        let fileElement = componentUtils.getElement(this, 'input[data-name="importConfigFile"]');

        generalUtils.readTextFile(fileElement).then(
            (result) => {
                let JSONConfigImportString = result;
                console.log(JSONConfigImportString);
                let JSONConfigImport;
                try {
                    JSONConfigImport = JSON.parse(JSONConfigImportString);
                } catch(err) {
                    this.importError = 'Error parsing JSON: ' + err;
                }

                try {

                    if(!generalUtils.isObjectEmpty(JSONConfigImport))
                    {
                        let tmpvalueObj = this.getValueObj();
                        let hasValueChanged = false;
                        for (let key in this.propInputs) 
                        {
                            if(generalUtils.objectHasProperty(this.propInputs, key))
                            {
                                let tmpVal = generalUtils.getObjPropValue(JSONConfigImport, this.propInputs[key].valuePath);
                                if(!generalUtils.isObjectEmpty(tmpVal))
                                {
                                    tmpvalueObj = generalUtils.setObjPropValue(tmpvalueObj, this.propInputs[key].valuePath, tmpVal);
                                    hasValueChanged = true;
                                }
                            }
                        }

                        if(hasValueChanged)
                        {
                            this.closeImportModal();
                            
                            this.dispatchEvent(new CustomEvent("valuechange", 
                            {detail: {value: JSON.stringify(tmpvalueObj)}}));
                        }
                        else
                        {
                            this.importError = 'No values to import found. ';
                        }

                    }
                } catch(err2) {
                    this.importError = 'Error during import: ' + err2;
                }
            },
            (error) => {
                this.importError = error + '';
            }
        );
            
                
        
    }

    handleDebugModeChange(e) {
        this.propInputs.debugMode.value = e.detail.checked;

        let tmpvalueObj = this.getValueObj();
        tmpvalueObj.debugMode = this.propInputs.debugMode.value;

        this.dispatchEvent(new CustomEvent("valuechange", 
            {detail: {value: JSON.stringify(tmpvalueObj)}}));
    }

}