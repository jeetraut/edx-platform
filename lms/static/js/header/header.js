/**
 * Ensuring collapsible and accessible components on multiple
 * screen sizes for the responsive lms header.
*/

function createMobileMenu() {
    /**
     * Dynamically create a mobile menu from all specified mobile links
     * on the page.
     */
    'use strict';
    $('.mobile-nav-item').each(function() {
        var mobileNavItem = $(this).clone().addClass('mobile-nav-link');
        mobileNavItem.attr('role', 'menuitem');
        // xss-lint: disable=javascript-jquery-append
        $('.mobile-menu').append(mobileNavItem);
    });
}

$(document).ready(function() {
    'use strict';
    var $hamburgerMenu;
    var $mobileMenu;
    // Toggling visibility for the user dropdown
    $('.global-header .toggle-user-dropdown').click(function() {
        var $dropdownMenu = $('.global-header .nav-item .dropdown-user-menu');
        var $userMenu = $('.global-header .user-dropdown');
        if ($dropdownMenu.is(':visible')) {
            $dropdownMenu.addClass('hidden');
            $userMenu.attr('aria-expanded', 'false');
        } else {
            $dropdownMenu.removeClass('hidden');
            $dropdownMenu.find('.dropdown-item')[0].focus();
            $userMenu.attr('aria-expanded', 'true');
        }
        $('.global-header .toggle-user-dropdown').toggleClass('open');
    });

    // Toggling menu visibility with the hamburger menu
    $('.global-header .hamburger-menu').click(function() {
        $hamburgerMenu = $('.global-header .hamburger-menu');
        $mobileMenu = $('.mobile-menu');
        if ($mobileMenu.is(':visible')) {
            $mobileMenu.addClass('hidden');
            $hamburgerMenu.attr('aria-expanded', 'false');
        } else {
            $mobileMenu.removeClass('hidden');
            $hamburgerMenu.attr('aria-expanded', 'true');
        }
        $hamburgerMenu.toggleClass('open');
    });

    // Hide hamburger menu if no nav items (sign in and register pages)
    if ($('.mobile-nav-item').size() === 0) {
        $('.global-header .hamburger-menu').addClass('hidden');
    }

    createMobileMenu();
});

$(window).click(function(e) {
    'use strict';
    var $userMenu = $('.global-header .nav-item .dropdown-user-menu');
    if ($userMenu.is(':visible') && !$(e.target).is('.dropdown-item, .toggle-user-dropdown')) {
         $userMenu.addClass('hidden');
    }
});

// Accessibility keyboard controls for user dropdown and mobile menu
$(document).on('keydown', function(e) {
    'use strict';
    var isNext,
        nextLink,
        loopFirst,
        loopLast,
        isLastItem = $(e.target).parent().is(':last-child'),
        isToggle = $(e.target).hasClass('toggle-user-dropdown'),
        isHamburgerMenu = $(e.target).hasClass('hamburger-menu'),
        isMobileOption = $(e.target).parent().hasClass('mobile-nav-link'),
        isDropdownOption = !isMobileOption && $(e.target).parent().hasClass('dropdown-item'),
        $userMenu = $('.global-header .user-dropdown'),
        $hamburgerMenu = $('.global-header .hamburger-menu'),
        $toggleUserDropdown = $('.global-header .toggle-user-dropdown');

    // Open or close relevant menu on enter or space click and focus on first element.
    if ((e.key === 'Enter' || e.key === 'Space') && (isToggle || isHamburgerMenu)) {
        // Don't allow for double click or page jump on Firefox browser
        e.preventDefault();
        e.stopPropagation();

        $(e.target).click();
        if (isHamburgerMenu) {
            if ($('.mobile-menu').is(':visible')) {
                $hamburgerMenu.attr('aria-expanded', true);
                $('.mobile-menu .mobile-nav-link a').first().focus();
            } else {
                $hamburgerMenu.attr('aria-expanded', false);
            }
        } else if (isToggle) {
            if ($('.global-header .nav-item .dropdown-user-menu').is(':visible')) {
                $userMenu.attr('aria-expanded', 'true');
                $('.global-header .dropdown-item a:first').focus();
            } else {
                $userMenu.attr('aria-expanded', false);
            }
        }
    }

    // Enable arrow functionality within the menu.
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (isDropdownOption || isMobileOption ||
        (isHamburgerMenu && $hamburgerMenu.hasClass('open')) || isToggle && $toggleUserDropdown.hasClass('open'))) {
        isNext = e.key === 'ArrowDown';
        if (isNext && !isHamburgerMenu && !isToggle && isLastItem) {
            // Loop to the start from the final element
            nextLink = isDropdownOption ? $toggleUserDropdown : $hamburgerMenu;
        } else if (!isNext && (isHamburgerMenu || isToggle)) {
            // Loop to the end when up arrow pressed from menu icon
            nextLink = isHamburgerMenu ? $('.mobile-menu .mobile-nav-link a').last()
                : $('.global-header .dropdown-user-menu .dropdown-nav-item').last().find('a');
        } else if (isNext && (isHamburgerMenu || isToggle)) {
            // Loop to the first element from the menu icon
            nextLink = isHamburgerMenu ? $('.mobile-menu .mobile-nav-link a').first()
                : $('.global-header .dropdown-user-menu .dropdown-nav-item').first().find('a');
        } else {
            // Loop up to the menu icon if first element in menu
            if (!isNext && $(e.target).parent().is(':first-child') && !isHamburgerMenu && !isToggle) {
                nextLink = isDropdownOption ? $toggleUserDropdown : $hamburgerMenu;
            } else {
                nextLink = isNext ?
                    $(e.target).parent().next().find('a') : // eslint-disable-line newline-per-chained-call
                    $(e.target).parent().prev().find('a'); // eslint-disable-line newline-per-chained-call
            }
        }
        nextLink.focus();

        // Don't let the screen scroll on navigation
        e.preventDefault();
        e.stopPropagation();
    }

    // Escape clears out of the menu
    if (e.key === 'Escape' && (isDropdownOption || isHamburgerMenu || isMobileOption || isToggle)) {
        if (isDropdownOption || isToggle) {
            $('.global-header .nav-item .dropdown-user-menu').addClass('hidden');
            $toggleUserDropdown.focus();
            $userMenu.attr('aria-expanded', 'false');
            $('.global-header .toggle-user-dropdown').removeClass('open');
        } else {
            $('.mobile-menu').addClass('hidden');
            $hamburgerMenu.focus()
                .attr('aria-expanded', 'false')
                .removeClass('open');
        }
    }

    // Loop when tabbing and using arrows
    if ((e.key === 'Tab') && ((isDropdownOption && isLastItem) || (isMobileOption && isLastItem) || (isHamburgerMenu
        && $hamburgerMenu.hasClass('open')) || (isToggle && $toggleUserDropdown.hasClass('open')))) {
        nextLink = null;
        loopFirst = isLastItem && !e.shiftKey && !isHamburgerMenu && !isToggle;
        loopLast = (isHamburgerMenu || isToggle) && e.shiftKey;
        if (!(loopFirst || loopLast)) {
            return;
        }
        e.preventDefault();
        if (isDropdownOption || isToggle) {
            nextLink = loopFirst ? $toggleUserDropdown : $('.global-header .dropdown-user-menu .dropdown-nav-item a').last();
        } else {
            nextLink = loopFirst ? $hamburgerMenu : $('.mobile-menu .mobile-nav-link a').last();
        }
        nextLink.focus();
    }
});
