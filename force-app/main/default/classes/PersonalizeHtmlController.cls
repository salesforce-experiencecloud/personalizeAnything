/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

public with sharing class PersonalizeHtmlController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> dataRequest(List<String> params) {
        List<String> userFields = new List<String>();
        List<String> contactFields = new List<String>();
        List<String> accountFields = new List<String>();
        
        for (String param : params) {
            List<String> splitParam = param.split('\\.');
            
            String resourceName = splitParam[0].toLowerCase();
            if (splitParam.size() != 2) {
                continue;
            }
            String fieldName = splitParam[1].toLowerCase();
            if (resourceName == 'user') {
                if (!userFields.contains(fieldName)) {
                    userFields.add(fieldName);
                }
            } else if (resourceName == 'contact') {
                if (!contactFields.contains(fieldName)) {
                    contactFields.add(fieldName);
                }
            } else if (resourceName == 'account') {
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

        Id contactId = (Id)user.get('ContactId');
        Id accountId = (Id)user.get('AccountId');

        if (Test.isRunningTest()) {
            Contact c = [SELECT Id, AccountId from Contact];
            contactId = c.Id;
            accountId = c.AccountId;
        }
        
        Contact contact = null;
        if (!contactFields.isEmpty() && contactId != null) {
            contact = Database.query('SELECT ' + String.join(contactFields, ', ') + ' FROM Contact WHERE Id = :contactId');
        }

        Account account = null;
        if (!accountFields.isEmpty() && accountId != null) {
            account = Database.query('SELECT ' + String.join(accountFields, ', ') + ' FROM Account WHERE Id = :accountId');
        }
        
        Map<String, Object> response = new Map<String, Object>();
        
        Map<String, Schema.SObjectField> userFieldMap = Schema.SObjectType.User.fields.getMap();
        for (String userField : userFields) {

            userField = userField.toLowerCase();

            if(userFields.contains(userField)) {

                Object tmpFieldValue = '';
            
                if (user.isSet(userField) && userFieldMap.get(userField).getDescribe().isAccessible()) {
                    tmpFieldValue = user.get(userField) != null ? user.get(userField) : tmpFieldValue;
                }

                response.put('user.' + userField, tmpFieldValue);

            }
        }

        if (contact != null) {
            Map<String, Schema.SObjectField> contactFieldMap = Schema.SObjectType.Contact.fields.getMap();
            for (String contactField : contactFields) {

                contactField = contactField.toLowerCase();

                if(contactFields.contains(contactField)) {

                    Object tmpFieldValue = '';
                
                    if (contact.isSet(contactField) && contactFieldMap.get(contactField).getDescribe().isAccessible()) {
                        tmpFieldValue = contact.get(contactField) != null ? contact.get(contactField) : tmpFieldValue;
                    }

                    response.put('contact.' + contactField, tmpFieldValue);

                }
            }
        }
        
        if (account != null) {
            Map<String, Schema.SObjectField> accountFieldMap = Schema.SObjectType.Account.fields.getMap();
            for (String accountField : accountFields) {

                accountField = accountField.toLowerCase();

                if(accountFields.contains(accountField)) {

                    Object tmpFieldValue = '';

                    if (account.isSet(accountField) && accountFieldMap.get(accountField).getDescribe().isAccessible()) {
                        tmpFieldValue = account.get(accountField) != null ? account.get(accountField) : tmpFieldValue;
                    }

                    response.put('account.' + accountField, tmpFieldValue);

                }
            }
        }

        return response;
    }
    
}