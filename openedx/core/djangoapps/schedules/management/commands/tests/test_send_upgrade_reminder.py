import logging
from unittest import skipUnless

import ddt
from django.conf import settings
from edx_ace import Message
from edx_ace.utils.date import serialize
from mock import patch
from opaque_keys.edx.locator import CourseLocator

from course_modes.models import CourseMode
from openedx.core.djangoapps.schedules import resolvers, tasks
from openedx.core.djangoapps.schedules.management.commands import send_upgrade_reminder as reminder
from openedx.core.djangoapps.schedules.management.commands.tests.send_email_base import ScheduleSendEmailTestBase, \
    ExperienceTest
from openedx.core.djangoapps.schedules.models import ScheduleExperience
from openedx.core.djangolib.testing.utils import skip_unless_lms
from student.tests.factories import UserFactory


LOG = logging.getLogger(__name__)


@ddt.ddt
@skip_unless_lms
@skipUnless('openedx.core.djangoapps.schedules.apps.SchedulesConfig' in settings.INSTALLED_APPS,
            "Can't test schedules if the app isn't installed")
class TestUpgradeReminder(ScheduleSendEmailTestBase):
    __test__ = True

    resolver = resolvers.UpgradeReminderResolver
    task = tasks.ScheduleUpgradeReminder
    deliver_task = tasks._upgrade_reminder_schedule_send
    command = reminder.Command
    deliver_config = 'deliver_upgrade_reminder'
    enqueue_config = 'enqueue_upgrade_reminder'
    expected_offsets = (2,)

    queries_deadline_for_each_course = True
    consolidates_emails_for_learner = True

    @ddt.data(True, False)
    @patch.object(tasks, 'ace')
    def test_verified_learner(self, is_verified, mock_ace):
        user = UserFactory.create(id=self.task.num_bins)
        current_day, offset, target_day, upgrade_deadline = self._get_dates()
        self._schedule_factory(
            enrollment__user=user,
            enrollment__mode=CourseMode.VERIFIED if is_verified else CourseMode.AUDIT,
        )

        self.task.apply(kwargs=dict(
            site_id=self.site_config.site.id, target_day_str=serialize(target_day), day_offset=offset,
            bin_num=self._calculate_bin_for_user(user),
        ))

        self.assertEqual(mock_ace.send.called, not is_verified)

    def test_filter_out_verified_schedules(self):
        current_day, offset, target_day, upgrade_deadline = self._get_dates()

        user = UserFactory.create()
        schedules = [
            self._schedule_factory(
                enrollment__user=user,
                enrollment__course__id=CourseLocator('edX', 'toy', 'Course{}'.format(i)),
                enrollment__mode=CourseMode.VERIFIED if i in (0, 3) else CourseMode.AUDIT,
            )
            for i in range(5)
        ]

        sent_messages = []
        with patch.object(self.task, 'async_send_task') as mock_schedule_send:
            mock_schedule_send.apply_async = lambda args, *_a, **_kw: sent_messages.append(args[1])

            self.task.apply(kwargs=dict(
                site_id=self.site_config.site.id, target_day_str=serialize(target_day), day_offset=offset,
                bin_num=self._calculate_bin_for_user(user),
            ))

            messages = [Message.from_string(m) for m in sent_messages]
            self.assertEqual(len(messages), 1)
            message = messages[0]
            self.assertItemsEqual(
                message.context['course_ids'],
                [str(schedules[i].enrollment.course.id) for i in (1, 2, 4)]
            )

    @ddt.data(
        ExperienceTest(experience=ScheduleExperience.DEFAULT, offset=expected_offsets[0], email_sent=True),
        ExperienceTest(experience=ScheduleExperience.COURSE_UPDATES, offset=expected_offsets[0], email_sent=False),
    )
    @patch.object(tasks, 'ace')
    def test_upgrade_reminder_experience(self, test_config, mock_ace):
        current_day, offset, target_day, upgrade_deadline = self._get_dates(offset=test_config.offset)

        schedule = self._schedule_factory(
            offset=offset,
            experience__experience_type=test_config.experience,
        )

        self.task.apply(kwargs=dict(
            site_id=self.site_config.site.id, target_day_str=serialize(target_day), day_offset=test_config.offset,
            bin_num=self._calculate_bin_for_user(schedule.enrollment.user),
        ))

        self.assertEqual(mock_ace.send.called, test_config.email_sent)

    @patch.object(tasks, 'ace')
    def test_upgrade_reminder_without_experience(self, mock_ace):
        current_day, offset, target_day, upgrade_deadline = self._get_dates(offset=self.expected_offsets[0])

        schedule = self._schedule_factory(
            offset=offset,
            experience=None,
        )

        self.task.apply(kwargs=dict(
            site_id=self.site_config.site.id, target_day_str=serialize(target_day), day_offset=offset,
            bin_num=self._calculate_bin_for_user(schedule.enrollment.user),
        ))

        self.assertTrue(mock_ace.send.called)
