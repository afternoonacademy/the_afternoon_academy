do $$
declare
  v_framework_id uuid;
  v_version_id uuid;
begin
  select id into v_framework_id
  from public.teaching_frameworks
  where slug = 'general-homework-support';

  if v_framework_id is null then
    insert into public.teaching_frameworks (
      title,
      slug,
      short_description,
      stage_guidance,
      provision_type,
      status
    )
    values (
      'General Homework Support',
      'general-homework-support',
      'Fast, practical support for the homework a learner brings to TAA. Capture only what will help the next session.',
      'Adapt examples and language to the learner''s age and school context.',
      'homework_support',
      'published'
    )
    returning id into v_framework_id;
  end if;

  select id into v_version_id
  from public.teaching_framework_versions
  where framework_id = v_framework_id and version_number = 1;

  if v_version_id is null then
    insert into public.teaching_framework_versions (
      framework_id,
      version_number,
      preparation_guidance,
      during_session_guidance,
      goal_guidance,
      evidence_guidance,
      avoid_guidance,
      reference_resources,
      prompt_config,
      published_at
    )
    values (
      v_framework_id,
      1,
      'Start with the homework or task the learner has brought. Confirm the subject, topic and what the school has asked them to do. Check the learner''s own understanding before explaining.',
      'Preserve the learner''s thinking. Use a prompt, example or scaffold before giving an answer. Notice where they become stuck and what helps them move forward.',
      'Create or update a goal only when a recurring learning need is worth tracking beyond today''s homework.',
      'Record the strongest useful evidence only: what was being worked on, where support was needed if relevant, where the learner got to, and what is worth picking up next.',
      'Do not write a school report. Avoid diagnosis, unsupported predictions, lengthy narrative or recording everything that happened.',
      '[]'::jsonb,
      jsonb_build_array(
        jsonb_build_object(
          'key','working_on',
          'label','What were we working on?',
          'help','Briefly record the homework, subject and topic.',
          'example','Maths homework — adding and subtracting fractions.',
          'required',true
        ),
        jsonb_build_object(
          'key','support_needed',
          'label','Where did they need support?',
          'help','Record the point where the learner became stuck, uncertain or needed help. Add what helped only if it will be useful next time.',
          'example','Could find a common denominator but became unsure when simplifying the final answer.',
          'required',false,
          'quickChoice','No specific issue'
        ),
        jsonb_build_object(
          'key','reached',
          'label','Where did we get to?',
          'help','Record what was completed and what the learner could do by the end of the session.',
          'example','Completed questions 1–8; last three completed independently after one worked example.',
          'required',true
        ),
        jsonb_build_object(
          'key','next_step',
          'label','What should we pick up next?',
          'help','Record the most useful thing for the next TAA session to revisit, practise or check.',
          'example','Quick retrieval on simplifying fractions before moving on.',
          'required',true,
          'quickChoice','Nothing specific / Continue as normal'
        )
      ),
      now()
    )
    returning id into v_version_id;
  end if;

  update public.teaching_frameworks
  set current_version_id = v_version_id,
      status = 'published'
  where id = v_framework_id;
end $$;
