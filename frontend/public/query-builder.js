
/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */


// The UI will only be able to build a subset of all possible queries. Several complex structures (e.g. nesting) are not possible and this is intended.
// TODO If no conditions are specified, the query will have no conditions. ??? MEANS empty where or just no where???


CampusExplorer.buildQuery = function () {
    let query = {};
    const tabPanel = document.getElementsByClassName("tab-panel active")[0];
    const datasetKind = tabPanel.getAttribute("data-type");
    buildWhere(query, tabPanel,datasetKind);
    buildOptions(query, tabPanel, datasetKind);
    buildTransformations(query, tabPanel, datasetKind);
    return query;
};

function buildWhere(query, tabPanel,datasetKind) {
    let where = {};
    let logicalOperator = "";
    let key = "";
    let comparator = "";
    let value = "";
    let filterArr = [];


    let conditionBlock = tabPanel.getElementsByClassName("form-group conditions")[0];
    let conditionsType = Array.from(conditionBlock.getElementsByClassName("control-group condition-type")[0].children);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
    // let checkedLogicalRadio = conditionsType.filter( (singleControlRadio) => singleControlRadio.children[0].checked );
    // query["test"] = checkedLogicalRadio[0].chiledren[0].value;
    conditionsType.forEach( function (singleRadio) {
        if (singleRadio.children[0].checked) {
            logicalOperator = singleRadio.children[0].value;
        }
    });

    let conditionsContainer = conditionBlock.getElementsByClassName("conditions-container")[0];

    Array.from(conditionsContainer.children).forEach( (condition) => {
        let controlFields = Array.from(condition.getElementsByClassName("control fields")[0].children[0].children);
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
        let queriedFields = controlFields.filter( (field) => field.selected);
        if (! queriedFields.length == 0) { // i don't need this checking right? coz there's only one box to be checked?
            key = (datasetKind +"_").concat(queriedFields[0].value);  // and these cannot be lower cased?
        }


        let controlOperators = Array.from(condition.getElementsByClassName("control operators")[0].children[0].children);
        let queriedOperators = controlOperators.filter((operator) => operator.selected);
        if (! queriedOperators.length == 0) {
            comparator = queriedOperators[0].value;
        }

        let controlTerm = condition.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
        if (isNaN(controlTerm)) {
            value = controlTerm;
        } else {
            value = parseFloat(controlTerm);
        }


        let filter = {};
        let keyValuePair = {};

        keyValuePair[key] = value ;
        filter[comparator] = keyValuePair;

        let notChecker = condition.getElementsByClassName("control not")[0].getElementsByTagName("input")[0].checked;
        if (notChecker) {
            let negation;
            negation["NOT"] = filter;
            filterArr.push(negation);
        } else {
            filterArr.push(filter);
        }
    });

    if (filterArr.length === 0) {
        query["WHERE"] = {};
        return;
    }

    if (filterArr.length === 1 ) {
        query["WHERE"] = filterArr[0];
    } else if (filterArr.length > 1) {
        // let radioVal = checkedLogicalRadio[0].chiledren[0].value;
        switch(logicalOperator) {
            case "any":
                // logicalOperator = "OR";
                where["OR"] = filterArr;
                query["WHERE"] = where;
                break;
            case "all":
                // logicalOperator = "AND";
                where["AND"] = filterArr;
                query["WHERE"] = where;
                break;
            case "none":
                // logicalOperator = "NOT";
                // query["WHERE"] = { "NOT" : { "AND": filterArr} }; // or is it only one? since there's no recursive logical comparator?
                where["NOT"] = filterArr[0];
                query["WHERE"] = where;
                break;
        }
    }
}


function buildOptions(query, tabPanel, datasetKind) {
    let options = {};
    let columnsBlock = tabPanel.getElementsByClassName("form-group columns")[0];
    let controlGroup = Array.from(((columnsBlock.getElementsByClassName("control-group")[0]).children));

    let checkedColumns = controlGroup.filter((column) => (column.children)[0].checked);
    let columns = checkedColumns.map(function (singleCol) {
        let ret;
        if (singleCol.className === "control field") {
            ret = (datasetKind + "_").concat(singleCol.children[0].value);
        } else if (singleCol.className === "control transformation") {
            ret = singleCol.children[0].value;
        }
        return ret;
    });

    options["COLUMNS"] = columns;
    // console.log(document.getElementsByClassName("tab-panel active")[0].getElementsByClassName("form-group columns")[0].getElementsByClassName("control-group")[0].children[0])

    let orderBlock = tabPanel.getElementsByClassName("form-group order")[0];
    let controlGroup_sort = orderBlock.getElementsByClassName("control-group")[0];
    let orderFields = Array.from(controlGroup_sort.children[0].children[0].children);
    let queriedOrderFields = orderFields.filter((order) => order.selected);
    let queriedOrderKey = queriedOrderFields.map(function (orderField) {
        let ret;
        if (orderField.className === "transformation") {
            ret = orderField.value;
        } else if (orderField.className !== "transformation"){
            ret = (datasetKind + "_") .concat(orderField.value);
        }
        return ret;
    });
    if (queriedOrderKey.length === 0) {
        query["OPTIONS"] = options;
        return;
    }
    let order = {};
    options["ORDER"] = order;

    options["ORDER"]["keys"] = queriedOrderKey;

    let descendingChecker = controlGroup_sort.getElementsByClassName("control descending")[0].children[0].checked;

    //  todo: finishi order

    // if (queriedOrderKey.length === 0) {
    //     query["OPTIONS"] = undefined;   // do i need this?
    // } else if ((!descendingChecker) && queriedOrderFields.length === 1) {
    //     query
    // }

    if (descendingChecker) {
        options["ORDER"]["dir"] = "DOWN";
    } else {
        options["ORDER"]["dir"] = "UP";
    }

    query["OPTIONS"] = options;
}

function buildTransformations(query, tabPanel, datasetKind) {
    let transformations = {};
    let applyArr = [];

    let groupBlock = tabPanel.getElementsByClassName("form-group groups")[0];
    let transformationBlock = tabPanel.getElementsByClassName("form-group transformations")[0];

    let controlGroup = Array.from(groupBlock.getElementsByClassName("control-group")[0].children);
    let groupedFields = controlGroup.filter((field) => field.children[0].checked);
    let groupedKeys = groupedFields.map((singleField) => (datasetKind + "_").concat(singleField.children[0].value));

    let transformationContainer = transformationBlock.getElementsByClassName("transformations-container")[0];
    let controlGroup_trans = Array.from(transformationContainer.children);
    controlGroup_trans.forEach(function (singleTrans) {
        let controlTerm = singleTrans.getElementsByClassName("control term")[0];
        let applyKey = controlTerm.getElementsByTagName("input")[0].value;
        let applyTokens = ["COUNT", "AVG", "MAX", "MIN", "SUM"];
        let controlOperator = Array.from(singleTrans.getElementsByClassName("control operators")[0].children);
        let TokenIndex = controlOperator[0].selectedIndex;
        // let queriedControlOp = controlOperator.filter((operator) => operator.selected);
        // let queiredOps = queriedControlOp.map((operator) => operator.value);
        // let queiredOps = controlOperator.map( function (operator) {
        //     if (operator.selected) {
        //         return operator.value;
        //     }
        // });
        let applyToken = applyTokens[TokenIndex];

        let coursesFields = ["audit","avg","dept","fail","id","instructor","pass","title","uuid","year"];
        let roomsFields = ["address","fullname","furniture","href","lat","lon","name","number","seats","shortname","type"];
        let controlFields_trans = Array.from(singleTrans.getElementsByClassName("control fields")[0].children);
        let FieldIndex = controlFields_trans[0].selectedIndex;
        // let queriedOptionField = controlFields_trans.filter((optionField) => optionField.selected);
        // let queriedFields_trans = queriedOptionField.map((optionField) => (datasetKind +"_").concat(optionField.value));
        let queriedfield_Apply;
        if (datasetKind === "courses") {
            queriedfield_Apply = "courses_" + coursesFields[FieldIndex];
        } else {
            queriedfield_Apply = "rooms_" + roomsFields[FieldIndex];
        }
        let applyField = queriedfield_Apply;


        let applyRule = {};
        let TokenKeyPair = {};
        TokenKeyPair[applyToken] = applyField;
        applyRule[applyKey] = TokenKeyPair;
        applyArr.push(applyRule);
    });

    // if (groupedKeys.length === 0 && applyArr.length === 0){
    if (((applyArr.length !== 0) || groupedKeys.length !== 0 ) ){
        transformations["GROUP"] = groupedKeys;
        transformations["APPLY"] = applyArr;
        query["TRANSFORMATIONS"] = transformations;
    } else if (groupedKeys.length === 0 || applyArr.length === 0){
        return;
    }
}
