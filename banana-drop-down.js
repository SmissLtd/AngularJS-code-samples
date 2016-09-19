'use strict';

/**
 * Create a drop-down widget.
 *
 * Directive assumes that element on which this directive found is a trigger of drop-down and that the next element is menu to be shown when clicking on the trigger.
 * By default showing a drop-down means just adding/replacing css property display to "block". If automatic-position attribute is present then additionally
 * menu element is moved to the body to make sure that element will not be hovered be its possibly absolutely positioned parents and its position is calculated
 * so that it appears right under the trigger.
 *
 * Available attributes:
 * automatic-position - if present then to drop-down menu under trigger will be absolutely positioned, otherwise DOM location of menu is not changed and menu is shown as is
 * on-open / on-close - specify an expression to be run on scope each time the drop-down is opened or closed
 * focus-on-open - specify a selector (JQuery) to point to an element inside a menu to be focused when menu is opened.
 * hover-on-open - specify a selector (JQuery) to point to an element inside a menu to be hovered when menu is opened.
 * drop-down-id - pass an id for this drop-down instance to identify it; you can then use this id when sending an event to close drop-down (see below)
 *
 * Trigger element gets a class "drop-down-open" when menu is open.
 *
 * You can close drop-down from outside of directive by broadcasting event "closeDropDown" and passing drop-down id as an argument (see drop-down-id attribute)
 */
angular.module('bananaApp').directive("bananaDropDown", function ($filter, $rootScope) {
    return {
        priority: 100,
        scope: {
            onClose: "&",
            onOpen: "&",
            dropDownId: "@",
            onHover: "=",
            model: "="
        },
        link: function (scope, element, attrs) {
            var trigger = $(element);
            var triggerHandler = $('.open-drop-down, .open_drop_down_for_workbasket', $(element).parent());
            var menu = $(element).next();
            var memory = {before: null};
            menu.hide();

            var automaticPosition = attrs.automaticPosition !== undefined;
            if (automaticPosition) {
                $("body").append(menu);
                menu.css("position", "absolute");
            }

            trigger.click(function (event) {
                callbackFunction(event);
                triggerHandler.toggleClass('banana-arrow-down5 banana-arrow-up5');
            });

            triggerHandler.click(function (event) {
                triggerHandler.toggleClass('banana-arrow-down5 banana-arrow-up5');
                callbackFunction(event);
            });


            if (angular.isDefined(attrs.tabAlive)) {
                attrs.$observe("tabAlive", function (val) {
                    if (val == "true") {
                        trigger.click(function (event) {
                            callbackFunction(event);
                        });
                        trigger.removeClass("disabled_element");
                    } else {
                        trigger.unbind();
                        trigger.addClass("disabled_element");
                    }
                });
            }

            menu.click(function (event) {
                event.stopPropagation();
            });

            // clean-up resources positioned outside the directive
            scope.$on("$destroy", function () {
                if (automaticPosition) {
                    menu.remove();
                }
                $(element).off('click');
                $(element).off('keyup');
            });

            scope.$watch("dropDownId", function () {
                scope.$on("closeDropDown", function (event, dropDownId) {
                    if (dropDownId === scope.dropDownId) {
                        onOutsideClick();
                    }
                });
            });

            scope.$on('click_outside', function (e) {
                e.preventDefault();
                triggerHandler.toggleClass('banana-arrow-down5 banana-arrow-up5');
                evalOnClose();
            });

            var onOutsideClick = function () {
                if (menu.is(':visible')) {
                    menu.hide();
                    $("html").off("click.dropdown.outside", onOutsideClick);
                    $(element).off('keyup');
                    triggerHandler.toggleClass('banana-arrow-down5 banana-arrow-up5');
                    $rootScope.$broadcast('click-outside', scope.dropDownId);
                    evalOnClose();
                }
            };

            var evalOnClose = function () {
                trigger.removeClass("drop-down-open");

                if (trigger.attr('value') != memory.before) {
                    scope.safeApply(function () {
                        memory.before = null;
                        scope.onClose()
                    });
                }

            };

            var evalOnOpen = function () {
                trigger.addClass("drop-down-open");

                memory.before = trigger.attr('value');

                scope.safeApply(function () {
                    scope.onOpen();
                });

                if (attrs.focusOnOpen) {
                    menu.find(attrs.focusOnOpen).focus();
                }

            };

            var callbackFunction = function (event) {
                // allow other drop-downs to hide first
                if (!menu.is(":visible")) {
                    $("html").click();
                }

                if (automaticPosition) {
                    menu.css("top", trigger.offset().top + trigger.height() + 5 + "px")
                        .css("left", trigger.offset().left + "px");
                }

                menu.toggle();
                event.stopPropagation();

                if (!menu.is(":visible")) {
                    $("html").off("click.dropdown.outside", onOutsideClick);
                    evalOnClose();
                } else {
                    $("html").on("click.dropdown.outside", onOutsideClick);
                    evalOnOpen();
                }
            };


            scope.safeApply = function (fn) {
                var phase = this.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
        }
    };
});