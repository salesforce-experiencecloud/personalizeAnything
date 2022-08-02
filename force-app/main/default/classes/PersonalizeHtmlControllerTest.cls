/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

@isTest
public with sharing class PersonalizeHtmlControllerTest {
    public static testMethod void dataRequest() {
        Account a = new Account(Name = 'TestAccount');
        insert a;
        Contact c = new Contact(LastName = 'TestContact', AccountId = a.Id);
        insert c;

        Test.startTest();
        List<String> params = new List<String>();
        params.add('user.name');
        params.add('contact.lastname');
        params.add('account.name');
        Map<String, Object> response = PersonalizeHtmlController.dataRequest(params);
        Test.stopTest();

        System.assert(response.containsKey(params[0]));
        System.assert(response.containsKey(params[1]));
        System.assert(response.containsKey(params[2]));
        System.assertEquals('TestContact', response.get(params[1]));
        System.assertEquals('TestAccount', response.get(params[2]));
    }
}