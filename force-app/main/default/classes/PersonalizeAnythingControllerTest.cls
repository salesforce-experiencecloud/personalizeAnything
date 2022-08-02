/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

@isTest
public with sharing class PersonalizeAnythingControllerTest {
    public static testMethod void dataRequestSuccess() {

        PersonalizeAnythingController.Criterion criterion1 = new PersonalizeAnythingController.Criterion('@user.id', 'Contains', 'String', System.UserInfo.getUserId(), '3');
        PersonalizeAnythingController.Criterion criterion2 = new PersonalizeAnythingController.Criterion('@contact.id', 'Contains', 'String', '000000000000000', '4');
        PersonalizeAnythingController.Criterion criterion3 = new PersonalizeAnythingController.Criterion('@account.id', 'Contains', 'String', '000000000000000', '5');
        Map<String, PersonalizeAnythingController.Criterion> criteriaMap = new Map<String, PersonalizeAnythingController.Criterion>();
        criteriaMap.put('3', criterion1);
        criteriaMap.put('4', criterion2);
        criteriaMap.put('5', criterion3);
        String input = System.JSON.serialize(criteriaMap);

        String jsonResponse = PersonalizeAnythingController.dataRequest(input);
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('3') != null);
        System.assert(Boolean.valueOf(responseMap.get('3')) == true);
        System.assert(responseMap.get('4') != null);
        System.assert(Boolean.valueOf(responseMap.get('4')) == false);
        System.assert(responseMap.get('5') != null);
        System.assert(Boolean.valueOf(responseMap.get('5')) == false);
    }

    public static testMethod void dataRequestSuccess2() {

        PersonalizeAnythingController.Criterion criterion1 = new PersonalizeAnythingController.Criterion('@user.isActive', 'Equals', 'Boolean', 'true', '3');
        PersonalizeAnythingController.Criterion criterion2 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Does Not Equal', 'Number', '-2', '4');
        Map<String, PersonalizeAnythingController.Criterion> criteriaMap = new Map<String, PersonalizeAnythingController.Criterion>();
        criteriaMap.put('3', criterion1);
        criteriaMap.put('4', criterion2);
        String input = System.JSON.serialize(criteriaMap);

        String jsonResponse = PersonalizeAnythingController.dataRequest(input);
        
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('3') != null);
        System.assert(Boolean.valueOf(responseMap.get('3')) == true);
        System.assert(responseMap.get('4') != null);
        System.assert(Boolean.valueOf(responseMap.get('4')) == true);
  
    }

    public static testMethod void dataRequestSuccessOtherOperators() {

        PersonalizeAnythingController.Criterion criterion1 = new PersonalizeAnythingController.Criterion('@user.isactive', 'Does Not Equal', 'Boolean', 'false', '3');
        PersonalizeAnythingController.Criterion criterion2 = new PersonalizeAnythingController.Criterion('@user.id', 'Equals', 'String', '000000000000000', '4');
        PersonalizeAnythingController.Criterion criterion3 = new PersonalizeAnythingController.Criterion('@user.id', 'Does Not Equal', 'String', '000000000000000', '5');
        PersonalizeAnythingController.Criterion criterion4 = new PersonalizeAnythingController.Criterion('@user.id', 'Starts With', 'String', '005', '6');
        PersonalizeAnythingController.Criterion criterion5 = new PersonalizeAnythingController.Criterion('@user.id', 'Is Not Included Within', 'String', System.UserInfo.getUserId() + ';0000000000000000;', '7');
        PersonalizeAnythingController.Criterion criterion6 = new PersonalizeAnythingController.Criterion('@user.id', 'Is Included Within', 'String', System.UserInfo.getUserId() + ';0000000000000000;', '8');
        PersonalizeAnythingController.Criterion criterion7 = new PersonalizeAnythingController.Criterion('@user.id', 'Does Not Contain', 'String', 'test', '9');
        PersonalizeAnythingController.Criterion criterion8 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Equals', 'Number', '-2', '10');
        PersonalizeAnythingController.Criterion criterion9 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Is Greater Than', 'Number', '-2', '11');
        PersonalizeAnythingController.Criterion criterion10 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Is less Than', 'Number', '-2', '12');
        PersonalizeAnythingController.Criterion criterion11 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Is Greater Than or Equals', 'Number', '-2', '13');
        PersonalizeAnythingController.Criterion criterion12 = new PersonalizeAnythingController.Criterion('@user.NumberOfFailedLogins', 'Is Less Than or Equals', 'Number', '-2', '14');

        Map<String, PersonalizeAnythingController.Criterion> criteriaMap = new Map<String, PersonalizeAnythingController.Criterion>();
        criteriaMap.put('3', criterion1);
        criteriaMap.put('4', criterion2);
        criteriaMap.put('5', criterion3);
        criteriaMap.put('6', criterion4);
        criteriaMap.put('7', criterion5);
        criteriaMap.put('8', criterion6);
        criteriaMap.put('9', criterion7);
        criteriaMap.put('10', criterion8);
        criteriaMap.put('11', criterion9);
        criteriaMap.put('12', criterion10);
        criteriaMap.put('13', criterion11);
        criteriaMap.put('14', criterion12);
        String input = System.JSON.serialize(criteriaMap);

        String jsonResponse = PersonalizeAnythingController.dataRequest(input);
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('3') != null);
        System.assert(Boolean.valueOf(responseMap.get('3')) == true);
        System.assert(responseMap.get('4') != null);
        System.assert(Boolean.valueOf(responseMap.get('4')) == false);
        System.assert(responseMap.get('5') != null);
        System.assert(Boolean.valueOf(responseMap.get('5')) == true);
        System.assert(responseMap.get('6') != null);
        System.assert(Boolean.valueOf(responseMap.get('6')) == true);
        System.assert(responseMap.get('7') != null);
        System.assert(Boolean.valueOf(responseMap.get('7')) == false);
        System.assert(responseMap.get('8') != null);
        System.assert(Boolean.valueOf(responseMap.get('8')) == true);
        System.assert(responseMap.get('9') != null);
        System.assert(Boolean.valueOf(responseMap.get('9')) == true);
        System.assert(responseMap.get('10') != null);
        System.assert(Boolean.valueOf(responseMap.get('10')) == false);
        System.assert(responseMap.get('11') != null);
        System.assert(Boolean.valueOf(responseMap.get('11')) == true);
        System.assert(responseMap.get('12') != null);
        System.assert(Boolean.valueOf(responseMap.get('12')) == false);
        System.assert(responseMap.get('13') != null);
        System.assert(Boolean.valueOf(responseMap.get('13')) == true);
        System.assert(responseMap.get('14') != null);
        System.assert(Boolean.valueOf(responseMap.get('14')) == false);
    }

    public static testMethod void dataRequestFailBadFieldName() {

        PersonalizeAnythingController.Criterion criterion1 = new PersonalizeAnythingController.Criterion('@user.notafield', 'Equals', 'Boolean', 'true', '3');
        Map<String, PersonalizeAnythingController.Criterion> criteriaMap = new Map<String, PersonalizeAnythingController.Criterion>();
        criteriaMap.put('3', criterion1);
        String input = System.JSON.serialize(criteriaMap);

        String jsonResponse = PersonalizeAnythingController.dataRequest(input);
        
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('error') != null);        
  
    }

    public static testMethod void dataRequestFailNoInput() {

        String jsonResponse = PersonalizeAnythingController.dataRequest(null);
        
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('error') != null);        
  
    }

    public static testMethod void dataRequestFailBadInput() {

        String jsonResponse = PersonalizeAnythingController.dataRequest('this is not json text');
        
        Map<String,Object> responseMap = (Map<String,Object>)System.JSON.deserializeUntyped(jsonResponse);
        System.assert(responseMap.get('error') != null);        
  
    }

}