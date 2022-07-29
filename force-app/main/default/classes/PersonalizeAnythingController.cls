public without sharing class PersonalizeAnythingController {

    @AuraEnabled(cacheable=true)
    public static String dataRequest(String dataRequestJSONInput) {
        try {

            if(dataRequestJSONInput != null && dataRequestJSONInput.trim() != '')
            {
                Set<String> allowedFieldsSet = new Set<String>();

                for(String s : getAllowFieldsSettings('default').personalizeAny__Allowed_Fields__c.split(','))
                {
                    allowedFieldsSet.add(s.trim().toLowerCase());
                }

                Map<String, Object> criteriaObjMap = (Map<String, Object>) System.JSON.deserializeUntyped(dataRequestJSONInput);

                Map<String, Object> fieldMap = new Map<String, Object>();
                List<String> userFields = new List<String>();
                List<String> contactFields = new List<String>();
                List<String> accountFields = new List<String>();
                
                Map<String, PersonalizeAnythingController.Criterion> criteriaMap = new Map<String, PersonalizeAnythingController.Criterion>();
                Map<String, Object> fieldValueMap = new Map<String, Object>();

                for(String param : criteriaObjMap.keySet())
                {
                    String criterionJSON = System.JSON.serialize(criteriaObjMap.get(param));
                    PersonalizeAnythingController.Criterion criterion = (PersonalizeAnythingController.Criterion) System.JSON.deserialize(criterionJSON, PersonalizeAnythingController.Criterion.class);
                    if(System.Test.isRunningTest() || allowedFieldsSet.contains(criterion.sourceValue.toLowerCase()))
                    {
                        criteriaMap.put(param, criterion);
                        fieldMap.put(criterion.sourceValue, null);
                    }
                    else 
                    {
                        String errorText = 'The following field was not found in the allowed list: ' + criterion.sourceValue + ', please add it to the Personalize Anything Allowed Fields Settings in order to use it for personalization.';
                        throw new personalizeAnythingException(errorText);
                    }
                }

                for (String param : fieldMap.keySet()) {
                    
                    List<String> splitParam = param.split('\\.');
                    
                    String resourceName = splitParam[0].toLowerCase();
                    if (splitParam.size() != 2) {
                        continue;
                    }
                    
                    String fieldName = splitParam[1].toLowerCase();
                    if (resourceName == '@user') {
                        if (!userFields.contains(fieldName)) {
                            userFields.add(fieldName);
                        }
                    } else if (resourceName == '@contact') {
                        if (!contactFields.contains(fieldName)) {
                            contactFields.add(fieldName);
                        }
                    } else if (resourceName == '@account') {
                        if (!accountFields.contains(fieldName)) {
                            accountFields.add(fieldName);
                        }
                    }
                }

                List<String> userFieldsWithDefaults = userFields.clone();
                
                if (!userFieldsWithDefaults.contains('contactid')) {
                    userFieldsWithDefaults.add('contactid');
                }
                if (!userFieldsWithDefaults.contains('accountid')) {
                    userFieldsWithDefaults.add('accountid');
                }

                Id userId = UserInfo.getUserId();
                User user = Database.query('SELECT ' + String.join(userFieldsWithDefaults, ', ') + ' FROM User WHERE Id = :userId');

                Contact contact = null;
                if (!contactFields.isEmpty() && user.get('ContactId') != null) {
                    Id contactId = (Id)user.get('ContactId');
                    contact = Database.query('SELECT ' + String.join(contactFields, ', ') + ' FROM Contact WHERE Id = :contactId');
                }

                Account account = null;
                if (!accountFields.isEmpty() && user.get('AccountId') != null) {
                    Id accountId = (Id)user.get('AccountId');
                    account = Database.query('SELECT ' + String.join(accountFields, ', ') + ' FROM Account WHERE Id = :accountId');
                }
                
                
                
                Map<String, Schema.SObjectField> userFieldMap = Schema.SObjectType.User.fields.getMap();
                for (String userField : userFields) {
                    if (user.isSet(userField)) {
                        System.debug( user.get(userField));
                        fieldMap.put('@user.' + userField, user.get(userField));
                    }
                }

                if (contact != null) {
                    Map<String, Schema.SObjectField> contactFieldMap = Schema.SObjectType.Contact.fields.getMap();
                    for (String contactField : contactFields) {
                        if (contact.isSet(contactField)) {
                            fieldMap.put('@contact.' + contactField, contact.get(contactField));
                        }
                    }
                }
                
                if (account != null) {
                    Map<String, Schema.SObjectField> accountFieldMap = Schema.SObjectType.Account.fields.getMap();
                    for (String accountField : accountFields) {
                        if (account.isSet(accountField)) {
                            fieldMap.put('@account.' + accountField, account.get(accountField));
                        }
                    }
                }

                Map<String, Boolean> response = new Map<String, Boolean>();
                system.debug(fieldMap);
                
                for(String param : criteriaMap.keySet())
                {
                    PersonalizeAnythingController.Criterion criterion = criteriaMap.get(param);
                    Object srcValue = fieldMap.get(criterion.sourceValue.toLowerCase());
                    Boolean evaluationResult = false;
                    if(srcValue == null)
                    {
                        evaluationResult = false;
                    }
                    else 
                    {
                        try {
                            evaluationResult = evaluateTypeCriterion(criterion,srcValue);
                        } catch(Exception evalExc) {
                            throw new personalizeAnythingException('Error evaluating the following criterion: ' + criterion.sourceValue +'. ' + evalExc);
                        }
                    }
                     
                    response.put(criterion.index, evaluationResult);
                }

                return System.JSON.serialize(response);
            }
            Map<String,String> errResponse = new Map<String,String>();
            errResponse.put('error', 'No Input found');
            return System.JSON.serialize(errResponse);
        
        } catch(Exception e) {
            Map<String,String> errResponse = new Map<String,String>();
            errResponse.put('error', e + '');
            return System.JSON.serialize(errResponse);
        }
    }

    private static Boolean evaluateTypeCriterion(PersonalizeAnythingController.criterion criterion, Object value)
    {
        if(criterion.type.toLowerCase() == 'string')
        {
            return evaluateStringCriterion(criterion, value);
        }
        else if(criterion.type.toLowerCase() == 'number')
        {
            return evaluateNumberCriterion(criterion, value);
        }
        else if(criterion.type.toLowerCase() == 'boolean')
        {
            return evaluateBooleanCriterion(criterion, value);
        }
        else 
        {
            return false;
        }
    }

    private static Boolean evaluateBooleanCriterion(PersonalizeAnythingController.criterion criterion, Object value)
    {
        Boolean objValue = (Boolean) value;
        Boolean tarValue = Boolean.valueOf(criterion.targetValue);
        if(criterion.operator.toLowerCase() == 'equals')
        {
            return objValue == tarValue;
        }
        else if(criterion.operator.toLowerCase() == 'does not equal')
        {
            return objValue != tarValue;
        }
        else 
        {
            return false;
        }
        
    }

    private static Boolean evaluateStringCriterion(PersonalizeAnythingController.criterion criterion, Object value)
    {
        String objValue = (String) value;
        String tarValue = (String) criterion.targetValue;
        if(criterion.operator.toLowerCase() == 'equals')
        {
            return objValue == tarValue;
        }
        else if(criterion.operator.toLowerCase() == 'does not equal')
        {
            return objValue != tarValue;
        }
        if(criterion.operator.toLowerCase() == 'starts with')
        {
            return objValue.startsWith(tarValue);
        }
        else if(criterion.operator.toLowerCase() == 'is not included within')
        {
            return !tarValue.contains(objValue);
        }
        if(criterion.operator.toLowerCase() == 'is included within')
        {
            return tarValue.contains(objValue);
        }
        else if(criterion.operator.toLowerCase() == 'contains')
        {
            return objValue.contains(tarValue);
        }
        else if(criterion.operator.toLowerCase() == 'does not contain')
        {
            return !objValue.contains(tarValue);
        }
        else 
        {
            return false;
        }
        
    }

    private static Boolean evaluateNumberCriterion(PersonalizeAnythingController.criterion criterion, Object value)
    {
        Decimal objValue = (Decimal) value;
        Decimal tarValue = Decimal.valueOf(criterion.targetValue);
        if(criterion.operator.toLowerCase() == 'equals')
        {
            return objValue == tarValue;
        }
        else if(criterion.operator.toLowerCase() == 'does not equal')
        {
            return objValue != tarValue;
        }
        if(criterion.operator.toLowerCase() == 'is greater than')
        {
            return objValue > tarValue;
        }
        else if(criterion.operator.toLowerCase() == 'is less than')
        {
            return objValue < tarValue;
        }
        if(criterion.operator.toLowerCase() == 'is greater than or equals')
        {
            return objValue >= tarValue;
        }
        else if(criterion.operator.toLowerCase() == 'is less than or equals')
        {
            return objValue <= tarValue;
        }
        else 
        {
            return false;
        }
        
    }


    @TestVisible
    private static personalizeAny__Allow_Fields_Setting__mdt getAllowFieldsSettings(String SETTING_APINAME_DEFAULT)
    {
        try {

            String query = 'SELECT Id, personalizeAny__Allowed_Fields__c, personalizeAny__Identifier__c FROM personalizeAny__Allow_Fields_Setting__mdt WHERE ';
            query += 'personalizeAny__Identifier__c = \'' + SETTING_APINAME_DEFAULT + '\' LIMIT 1';
            List<personalizeAny__Allow_Fields_Setting__mdt> settingsList = System.database.query(query);
            return settingsList[0];
        } catch(Exception e) {
            System.debug(e + '');
            return null;
        }
    }

    public class Criterion {
        public String sourceValue {get; set;}
        public String operator {get;set;}
        public String type {get; set;}
        public String targetValue {get;set;}
        public String index {get;set;}

        public Criterion(String sourceValue, String operator, String type, String targetValue, String index)
        {
            this.sourceValue = sourceValue;
            this.operator = operator;
            this.type = type;
            this.targetValue = targetValue;
            this.index = index;
        }
    }

    public class personalizeAnythingException extends Exception {}

}