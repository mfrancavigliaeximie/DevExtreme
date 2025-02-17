import $ from 'jquery';
import legendModule, { Legend } from 'viz/components/legend';
import vizMocks, { stubClass } from '../../helpers/vizMocks.js';
import rendererModule from 'viz/core/renderers/renderer';
import titleModule from 'viz/core/title';
import tooltipModule from 'viz/core/tooltip';
import loadingIndicatorModule from 'viz/core/loading_indicator';

import 'viz/gauges/bar_gauge';

const environment = {
    beforeEach() {
        this.renderer = new vizMocks.Renderer();

        sinon.stub(rendererModule, 'Renderer').callsFake(() => {
            return this.renderer;
        });
    },
    afterEach() {
        rendererModule.Renderer.restore();
    },

    createGauge(options) {
        return $('<div>')
            .appendTo($('#qunit-fixture'))
            .dxBarGauge(options)
            .dxBarGauge('instance');
    }
};

const stubLegend = stubClass(Legend);

$('<div id="test-container"></div>')
    .css({
        width: '400px',
        height: '400px'
    })
    .appendTo('#qunit-fixture');

const _LoadingIndicator = loadingIndicatorModule.LoadingIndicator;

titleModule.DEBUG_set_title(vizMocks.Title);
tooltipModule.Tooltip = vizMocks.Tooltip;
loadingIndicatorModule.DEBUG_set_LoadingIndicator(vizMocks.LoadingIndicator);

QUnit.module('Misc', {
    beforeEach: function() {
        const renderer = this.renderer = new vizMocks.Renderer();
        rendererModule.Renderer = function() { return renderer; };
    },

    create: function(options) {
        this.widget = $('#test-container').dxBarGauge(options).dxBarGauge('instance');
        return this.widget;
    },

    bar: function(index) {
        return this.renderer.arc.getCall(2 * index + 1).returnValue;
    }
});

QUnit.test('palette in repeat mode', function(assert) {
    this.create({
        values: [1, 2, 3, 4],
        paletteExtensionMode: 'alternate'
    });
    this.renderer.arc.reset();

    this.widget.option('palette', ['red', 'green', 'yellow']);

    assert.deepEqual(this.bar(0).attr.getCall(1).args[0].fill, 'red', 'bar 1 color');
    assert.deepEqual(this.bar(1).attr.getCall(1).args[0].fill, 'green', 'bar 2 color');
    assert.deepEqual(this.bar(2).attr.getCall(1).args[0].fill, 'yellow', 'bar 3 color');
    assert.deepEqual(this.bar(3).attr.getCall(1).args[0].fill, '#ff3232', 'bar 4 color');
});

QUnit.test('palette in blend mode', function(assert) {
    this.create({
        values: [1, 2, 3, 4],
        paletteExtensionMode: 'blend'
    });
    this.renderer.arc.reset();

    this.widget.option('palette', ['red', 'green', 'yellow']);

    assert.deepEqual(this.bar(0).attr.getCall(1).args[0].fill, 'red', 'bar 1 color');
    assert.deepEqual(this.bar(1).attr.getCall(1).args[0].fill, 'green', 'bar 2 color');
    assert.deepEqual(this.bar(2).attr.getCall(1).args[0].fill, '#80c000', 'bar 3 color');
    assert.deepEqual(this.bar(3).attr.getCall(1).args[0].fill, 'yellow', 'bar 4 color');
});

QUnit.test('palette extension mode can be changed', function(assert) {
    this.create({
        values: [1, 2, 3, 4],
        paletteExtensionMode: 'blend',
        palette: ['red', 'green', 'yellow']
    });
    this.renderer.arc.reset();

    this.widget.option({ paletteExtensionMode: 'alternate' });

    assert.deepEqual(this.bar(0).attr.getCall(1).args[0].fill, 'red', 'bar 1 color');
    assert.deepEqual(this.bar(1).attr.getCall(1).args[0].fill, 'green', 'bar 2 color');
    assert.deepEqual(this.bar(2).attr.getCall(1).args[0].fill, 'yellow', 'bar 3 color');
    assert.deepEqual(this.bar(3).attr.getCall(1).args[0].fill, '#ff3232', 'bar 4 color');
});

QUnit.test('Animation after false resizing', function(assert) {
    this.create({ values: [1, 2] });
    this.widget.option('size', { width: 400, height: 400 });

    this.renderer.g.returnValues[5].animate.reset();

    this.widget.values([2, 3]);

    assert.strictEqual(this.renderer.g.returnValues[5].animate.callCount, 1, 'animation');
});

QUnit.test('Change theme when loading indicator is shown', function(assert) {
    loadingIndicatorModule.DEBUG_set_LoadingIndicator(_LoadingIndicator);
    try {
        this.create({ values: [1, 2] });
        this.widget.showLoadingIndicator();

        this.widget.option('theme', 'test');

        assert.ok(true, 'no errors');
    } finally {
        loadingIndicatorModule.DEBUG_set_LoadingIndicator(vizMocks.LoadingIndicator);
    }
});

QUnit.test('Too many bars. Animation true', function(assert) {
    this.create({
        size: {
            width: 10,
            height: 10
        },
        animation: true,
        values: [1, 2, 3, 4, 5, 6, 7, 8],
        label: { visible: false }
    });

    assert.equal(this.renderer.arc.callCount, 16);
});

QUnit.test('Too many bars. Animation true', function(assert) {
    this.create({
        size: {
            width: 10,
            height: 10
        },
        animation: false,
        values: [1, 2, 3, 4, 5, 6, 7, 8],
        label: { visible: false }
    });

    assert.equal(this.renderer.arc.callCount, 16);
});

QUnit.module('Legend', {
    beforeEach() {
        this.renderer = new vizMocks.Renderer();

        sinon.stub(rendererModule, 'Renderer').callsFake(() => {
            return this.renderer;
        });

        legendModule._setLegend(sinon.spy(
            () => {
                const stub = new stubLegend();
                stub.stub('measure').returns([120, 120]);
                stub.stub('getTemplatesGroups').returns([]);
                stub.stub('getTemplatesDef').returns([]);
                stub.stub('layoutOptions').returns({
                    horizontalAlignment: 'right',
                    verticalAlignment: 'top',
                    side: 'horizontal'
                });
                return stub;
            }
        ));
    },
    afterEach() {
        legendModule._setLegend(Legend);
        rendererModule.Renderer.restore();
    },

    createGauge(options) {
        return $('<div>').appendTo($('#qunit-fixture')).dxBarGauge(options).dxBarGauge('instance');
    }
});

QUnit.test('Create a legend on widget initialization', function(assert) {
    this.createGauge({
        values: [1, 2],
        legend: { visible: true }
    });

    const legendCtorArgs = legendModule.Legend.lastCall.args[0];
    const legendGroup = this.renderer.g.getCall(3).returnValue;

    assert.equal(legendGroup.attr.lastCall.args[0].class, 'dxg-legend');
    assert.equal(legendCtorArgs.renderer, this.renderer);
    assert.equal(legendCtorArgs.textField, 'text');
});

QUnit.test('Create legend item', function(assert) {
    this.createGauge({
        values: [1, 5],
        legend: { visible: true },
        palette: ['black', 'green']
    });

    const passedItems = legendModule.Legend.getCall(0).returnValue.update.lastCall.args[0];
    assert.equal(passedItems.length, 2);
    assert.deepEqual(passedItems[0], {
        id: 0,
        text: '1.0',
        item: {
            value: 1,
            color: 'black',
            index: 0
        },
        states: {
            normal: { fill: 'black' }
        },
        visible: true
    });

    assert.deepEqual(passedItems[1], {
        id: 1,
        text: '5.0',
        item: {
            value: 5,
            color: 'green',
            index: 1
        },
        states: {
            normal: { fill: 'green' }
        },
        visible: true
    });
});

QUnit.test('Update legend items', function(assert) {
    const gauge = this.createGauge({
        values: [1, 5],
        legend: { visible: true },
        palette: ['black', 'green']
    });

    gauge.values([10]);

    const passedItems = legendModule.Legend.getCall(0).returnValue.update.lastCall.args[0];
    assert.equal(passedItems.length, 1);
    assert.deepEqual(passedItems[0], {
        id: 0,
        text: '10.0',
        item: {
            value: 10,
            color: 'black',
            index: 0
        },
        states: {
            normal: { fill: 'black' }
        },
        visible: true
    });
});

QUnit.test('Bar is rendered after layout legend', function(assert) {
    this.createGauge({
        values: [1, 5],
        size: {
            width: 300
        },
        legend: { visible: true },
        animation: false
    });
    const bar = this.renderer.g.getCall(4).returnValue.children[0];
    assert.equal(bar.attr.lastCall.args[0].outerRadius, 50);
});

QUnit.test('Format legend as labels', function(assert) {
    this.createGauge({
        label: {
            format: {
                type: 'currency'
            }
        },
        values: [10000],
        legend: { visible: true }
    });

    const passedItems = legendModule.Legend.getCall(0).returnValue.update.lastCall.args[0];
    assert.equal(passedItems[0].text, '$10,000');
});

QUnit.test('Format legend with custom type', function(assert) {
    this.createGauge({
        label: {
            format: {
                type: 'currency'
            }
        },
        legend: {
            visible: true,
            itemTextFormat: {
                type: 'thousands'
            }
        },
        values: [5700]
    });

    const passedItems = legendModule.Legend.getCall(0).returnValue.update.lastCall.args[0];
    assert.deepEqual(passedItems[0].text, '6K');
});

QUnit.module('Center Template', environment);

QUnit.test('Should create group for center template on widget creating', function(assert) {
    const centerTemplate = sinon.stub();
    this.createGauge({ centerTemplate });

    const centerTemplateGroup = this.renderer.g.getCall(6).returnValue;

    assert.deepEqual(centerTemplateGroup.attr.args[0][0], { class: 'dxg-hole-template' });
    assert.deepEqual(centerTemplateGroup.linkOn.args[0][0], this.renderer.root);
    assert.strictEqual(centerTemplateGroup.linkOn.args[0][1], 'center-template');
    assert.ok(centerTemplateGroup.linkAppend.called);
});

QUnit.test('Should render center template in group on widget creating', function(assert) {
    const centerTemplate = sinon.stub();
    this.createGauge({ centerTemplate });

    const centerTemplateGroup = this.renderer.g.getCall(6).returnValue;

    assert.deepEqual(centerTemplateGroup.css.args[0][0], {
        cursor: 'default',
        fill: '#767676',
        'font-family': '\'Segoe UI\', \'Helvetica Neue\', \'Trebuchet MS\', Verdana, sans-serif',
        'font-size': 12,
        'font-weight': 400
    }, 'styles applied on group');
    assert.deepEqual(centerTemplateGroup.attr.args[1][0], { visibility: 'hidden' }, 'group was hidden on start render');
    assert.deepEqual(centerTemplateGroup.attr.args[2][0], { visibility: 'visible' }, 'group start visible after render');
    assert.ok(centerTemplate.called, 'template function is called');
    assert.deepEqual(centerTemplateGroup.move.args[0], [489, 167], 'group was moved to center');
});

QUnit.test('Should render center template on option update', function(assert) {
    const firstCenterTemplate = sinon.stub();
    const secondCenterTemplate = sinon.stub();
    const gauge = this.createGauge({ centerTemplate: firstCenterTemplate });

    const centerTemplateGroup = this.renderer.g.getCall(6).returnValue;
    centerTemplateGroup.clear.reset();

    gauge.option('centerTemplate', secondCenterTemplate);

    assert.ok(centerTemplateGroup.clear.called, 'group was cleared');
    assert.strictEqual(secondCenterTemplate.callCount, 1, 'new template function is called');
});

QUnit.module('Disposing', environment);

QUnit.test('Should dispose center template on dispose widget', function(assert) {
    const centerTemplate = sinon.stub();
    const gauge = this.createGauge({ centerTemplate });

    const centerTemplateGroup = this.renderer.g.getCall(6).returnValue;

    gauge.dispose();

    assert.ok(centerTemplateGroup.linkOff.called);
    assert.ok(centerTemplateGroup.dispose.called);
});
